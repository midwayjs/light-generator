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

  constructor(options: NpmGeneratorOptions) {
    super(options);
    this.npmClient = options.npmClient;
    this.registryUrl = options.registryUrl
      ? '--registry=' + options.registryUrl
      : '';
    this.tmpPath = getTmpDir();
    fse.ensureDirSync(this.tmpPath);
    debugLogger('current npm module = [%s]', this.npmClient);
  }

  private async getPackage() {
    const data = execSync(
      `${this.npmClient} view ${this.templateUri} dist-tags --json ${this.registryUrl}`,
      {
        cwd: process.env.HOME,
      }
    ).toString();
    const remoteVersion = JSON.parse(data)['latest'];
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
      debugLogger('download cmd = [%s]', cmd);

      // run download
      execSync(cmd, {
        cwd: this.tmpPath,
        stdio: ['pipe', 'ignore', 'pipe'],
      });

      await tar.x({
        file: join(this.tmpPath, `${this.pkgRootName}.tgz`),
        C: join(this.tmpPath, this.pkgRootName),
      });

      if (!dirExistsSync(currentPkgRoot)) {
        throw new Error(`${currentPkgRoot} package download error`);
      }

      if (fse.existsSync(join(currentPkgRoot, 'package.json'))) {
        const pkg = require(join(currentPkgRoot, 'package.json'));
        if (pkg['dependencies']) {
          debugLogger('find package.json and dependencies');
          const installCmd = `${this.npmClient} ${this.registryUrl} install --production`;
          execSync(installCmd, {
            cwd: currentPkgRoot,
            stdio: ['pipe', 'ignore', 'pipe'],
          });
          debugLogger('install dependencies complete');
        }
      }

      await fse.writeFile(join(currentPkgRoot, '.success'), 'complete');
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
