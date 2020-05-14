import { CommonGenerator } from './CommonGenerator';
import { NpmGeneratorOptions } from '../interface';
import { execSync } from 'child_process';
import { join } from 'path';
import * as fse from 'fs-extra';
import { dirExistsSync } from '../util/fs';
import * as tar from 'tar';
import { getTmpDir, renamePackageName } from '../util/';
import { debuglog as Debuglog } from 'util';

export class NpmPatternGenerator extends CommonGenerator {
  npmClient: string;
  tmpPath: string;
  pkgRootName: string;
  registryUrl: string;
  debugLogger = Debuglog('generator:npm');

  constructor(options: NpmGeneratorOptions) {
    super(options);
    this.npmClient = options.npmClient;
    this.registryUrl = options.registryUrl
      ? '--registry=' + options.registryUrl
      : '';
    this.tmpPath = getTmpDir();
    fse.ensureDirSync(this.tmpPath);
    this.debugLogger('current npm module = [%s]', this.npmClient);
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
    this.debugLogger('currentPkgRoot = [%s]', currentPkgRoot);
    if (!dirExistsSync(currentPkgRoot)) {
      // clean template directory first
      if (dirExistsSync(join(this.tmpPath, this.pkgRootName))) {
        await fse.remove(join(this.tmpPath, this.pkgRootName));
      }
      const cmd = `${this.npmClient} pack ${this.templateUri}@${remoteVersion} ${this.registryUrl}| mkdir ${this.pkgRootName}`;
      this.debugLogger('download cmd = [%s]', cmd);
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
          this.debugLogger('find package.json and dependencies');
          const installCmd = `${this.npmClient} install --production`;
          execSync(installCmd, {
            cwd: currentPkgRoot,
            stdio: ['pipe', 'ignore', 'pipe'],
          });
          this.debugLogger('install dependencies complete');
        }
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
