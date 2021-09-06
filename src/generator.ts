import { DirectoryCopyWalker } from './util/copyDirContents';
import { CopyRule, CopyWalker } from './interface';
import { NpmPatternGenerator } from './generator/NpmPatternGenerator';
import { LocalPatternGenerator } from './generator/LocalPatternGenerator';
import { ignoreRule, replaceRule } from './rule';
import { getTmpDir } from './util/';
import { dirExistsSync } from './util/fs';
import { remove } from 'fs-extra';
import EventEmitter from 'events';

export class LightGenerator {
  options;
  copyWalker: CopyWalker;
  eventCenter: EventEmitter;

  constructor(
    options: {
      disableDefaultRule: boolean;
      copyRule?: CopyRule[];
    } = { disableDefaultRule: false }
  ) {
    this.options = options;
    this.eventCenter = new EventEmitter();
    this.copyWalker = new DirectoryCopyWalker(
      Object.assign(this.options, {
        eventCenter: this.eventCenter,
      })
    );
    if (!this.options.disableDefaultRule) {
      this.addDefaultCopyRule();
    }
  }

  addDefaultCopyRule() {
    this.copyWalker.addCopyRule(replaceRule);
    this.copyWalker.addCopyRule(ignoreRule);
  }

  defineLocalPath(options: {
    templateName?: string;
    templatePath: string;
    targetPath: string;
  }) {
    return new LocalPatternGenerator({
      templateUri: options.templatePath,
      targetPath: options.targetPath,
      templateName: options.templateName,
      copyWalker: this.copyWalker,
      eventCenter: this.eventCenter,
    });
  }

  defineNpmPackage(options: {
    npmPackage: string;
    targetPath: string;
    npmClient?: string;
    registryUrl?: string;
    targetVersion?: string;
    // 可以选择跳过安装依赖
    npmInstall?: boolean;
  }) {
    let npmClient = options.npmClient || 'npm';
    // 内部执行的命令，yarn 没有，所以固化为 npm
    if (npmClient === 'yarn') {
      npmClient = 'npm';
    }
    // 默认安装，可选择跳过
    const npmInstall = typeof options.npmInstall === 'boolean' ? options.npmInstall : true;
    return new NpmPatternGenerator({
      templateUri: options.npmPackage,
      targetPath: options.targetPath,
      copyWalker: this.copyWalker,
      npmClient,
      registryUrl: options.registryUrl,
      eventCenter: this.eventCenter,
      npmInstall,
      targetVersion: options.targetVersion || 'latest',
    });
  }

  static async cleanCache() {
    const tmpDir = getTmpDir();
    if (dirExistsSync(tmpDir)) {
      await remove(tmpDir);
    }
  }
}
