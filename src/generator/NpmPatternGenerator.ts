import { CommonGenerator } from './CommonGenerator';
import { NpmGeneratorOptions } from '../interface';
import { exec, execSync } from 'child_process';
import { join } from 'path';
import * as fse from 'fs-extra';
import { dirExistsSync } from '../util/fs';
import * as tar from 'tar';
import { getTmpDir, renamePackageName } from '../util/';
import { debuglog as Debuglog } from 'util';
import Spin from 'light-spinner';

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
      const cmd = `${this.npmClient} pack ${this.templateUri}@${remoteVersion} ${this.registryUrl}&& mkdir ${this.pkgRootName}`;
      this.debugLogger('download cmd = [%s]', cmd);

      // create spin
      const spin = new Spin({
        text: 'Downloading, please wait a moment',
      });
      spin.start();
      // run download
      await this.execPromise(cmd, this.tmpPath);

      spin.text = 'Unzipping, please wait a moment';

      await tar.x({
        file: join(this.tmpPath, `${this.pkgRootName}.tgz`),
        C: join(this.tmpPath, this.pkgRootName),
      });
      spin.stop();

      if (!dirExistsSync(currentPkgRoot)) {
        throw new Error(`${currentPkgRoot} package download error`);
      }

      if (fse.existsSync(join(currentPkgRoot, 'package.json'))) {
        const pkg = require(join(currentPkgRoot, 'package.json'));
        if (pkg['dependencies']) {
          const spin = new Spin({
            text: 'Installing template dependencies',
          });
          spin.start();
          this.debugLogger('find package.json and dependencies');
          const installCmd = `${this.npmClient} install --production`;
          await this.execPromise(installCmd, currentPkgRoot);
          this.debugLogger('install dependencies complete');
          spin.stop();
        }
      }
    }
  }

  async execPromise(cmd, cwd) {
    return new Promise((resolve, reject) => {
      exec(
        cmd,
        { cwd },
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        }
      );
    });
  }

  async getTemplateConfig() {
    await this.getPackage();
    return super.getTemplateConfig();
  }

  getTemplatePath() {
    return join(this.tmpPath, this.pkgRootName, 'package');
  }
}
