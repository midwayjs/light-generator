import { CommonGenerator } from './CommonGenerator';
import { NpmGeneratorOptions } from '../interface';
import { execSync } from 'child_process';
import { join } from 'path';
import * as fse from 'fs-extra';
import { dirExistsSync, fileExistsSync } from '../util/fs';
import * as tar from 'tar';
import { getTmpDir, renamePackageName } from '../util/';
import { debuglog as Debuglog } from 'util';
const debugLogger = Debuglog('generator:npm');

export class NpmPatternGenerator extends CommonGenerator {
  npmClient: string;
  tmpPath: string;
  pkgRootName: string;
  registryUrl: string;
  targetVersion: string;
  npmInstall: boolean;

  constructor(options: NpmGeneratorOptions) {
    super(options);
    this.npmClient = options.npmClient;
    this.npmInstall = !!options.npmInstall;
    this.registryUrl = options.registryUrl
      ? '--registry=' + options.registryUrl
      : '';
    this.tmpPath = getTmpDir();
    this.targetVersion = options.targetVersion;
    fse.ensureDirSync(this.tmpPath);
    debugLogger('current npm module = [%s]', this.npmClient);
  }

  private async getPackage() {
    const cmd = `${this.npmClient} view ${this.templateUri} dist-tags --json ${this.registryUrl}`;
    const backupCmd = `npm view ${this.templateUri} dist-tags --json`;
    let failOnce = false;
    let data;
    try {
      data = execSync(cmd, {
        cwd: process.env.HOME,
      }).toString();
    } catch (err) {
      failOnce = true;
      console.warn(
        `[Generator]: "${cmd}" find version failed and try with npm`
      );
      debugLogger(`err = ${err.message}`);
      data = execSync(backupCmd, {
        cwd: process.env.HOME,
      }).toString();
    }

    const remoteVersion = JSON.parse(data)[this.targetVersion || 'latest'];
    this.pkgRootName = `${renamePackageName(
      this.templateUri
    )}-${remoteVersion}`;
    const currentPkgRoot = this.getTemplatePath();
    debugLogger(
      'currentPkgRoot = [%s], tmpPath = [%s]',
      currentPkgRoot,
      this.tmpPath
    );
    // 清理失败的模板
    if (
      dirExistsSync(currentPkgRoot) &&
      !fileExistsSync(join(currentPkgRoot, '.success'))
    ) {
      await fse.remove(currentPkgRoot);
    }

    if (!dirExistsSync(currentPkgRoot)) {
      // clean template directory first
      if (dirExistsSync(join(this.tmpPath, this.pkgRootName))) {
        await fse.remove(join(this.tmpPath, this.pkgRootName));
      }
      const cmd = `${this.npmClient} pack ${this.templateUri}@${remoteVersion} ${this.registryUrl}&& mkdir ${this.pkgRootName}`;
      const backupCmd = `npm pack ${this.templateUri}@${remoteVersion} && mkdir ${this.pkgRootName}`;
      debugLogger('download cmd = [%s]', cmd);

      // run download

      try {
        execSync(cmd, {
          cwd: this.tmpPath,
          stdio: ['pipe', 'ignore', 'pipe'],
        });
      } catch (err) {
        failOnce = true;
        console.warn(
          `[Generator]: "${cmd}" download template failed and try with npm`
        );
        debugLogger(`err = ${err.message}`);
        // 兜底使用 npm 下载模板
        execSync(backupCmd, {
          cwd: this.tmpPath,
          stdio: ['pipe', 'ignore', 'pipe'],
        });
      }
      // 解压包
      await tar.x({
        file: join(this.tmpPath, `${this.pkgRootName}.tgz`),
        C: join(this.tmpPath, this.pkgRootName),
      });

      if (!dirExistsSync(currentPkgRoot)) {
        throw new Error(`${currentPkgRoot} package download error`);
      }

      // 标记模板包下载成功
      await fse.writeFile(join(currentPkgRoot, '.success'), 'complete');

      // 这里的依赖是模板的依赖，并非项目的依赖
      if (
        this.npmInstall &&
        fse.existsSync(join(currentPkgRoot, 'package.json'))
      ) {
        const pkg = require(join(currentPkgRoot, 'package.json'));
        if (pkg['dependencies']) {
          debugLogger('find package.json and dependencies');
          let installCmd = `${this.npmClient} ${this.registryUrl} install --production`;
          if (failOnce) {
            installCmd = 'npm install --production';
          }
          execSync(installCmd, {
            cwd: currentPkgRoot,
            stdio: ['pipe', 'ignore', 'pipe'],
          });
          debugLogger('install dependencies complete');
        }
      }

      if (failOnce) {
        console.warn(
          '[Generator]: Code directory has created and dependencies may be not complete installed.'
        );
        console.warn(
          '[Generator]: Please enter the code directory and run "npm install" manually after remove node_modules and lock file.'
        );
        console.warn(
          '[Generator]: Please ignore the prompt for correct output'
        );
      }
    }
  }

  async getTemplateConfig() {
    await this.getPackage();
    return super.getTemplateConfig();
  }

  getTemplatePath() {
    return join(this.tmpPath, this.pkgRootName, 'package');
  }
}
