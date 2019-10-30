import { CommonGenerator } from './CommonGenerator';
import { NpmGeneratorOptions } from '../interface';
import { execSync } from 'child_process';
import { join } from 'path';
import * as fse from 'fs-extra';
import { dirExistsSync } from '../util/fs';
import * as tar from 'tar';
import { getTmpDir, renamePackageName } from '../util/';

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
    if (!dirExistsSync(currentPkgRoot)) {
      // clean template directory first
      if (dirExistsSync(this.pkgRootName)) {
        await fse.remove(this.pkgRootName);
      }
      const cmd = `${this.npmClient} pack ${this.templateUri}@${remoteVersion} ${this.registryUrl}| mkdir ${this.pkgRootName}`;
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
