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
  }) {
    return new NpmPatternGenerator({
      templateUri: options.npmPackage,
      targetPath: options.targetPath,
      copyWalker: this.copyWalker,
      npmClient: options.npmClient || 'npm',
      registryUrl: options.registryUrl,
      eventCenter: this.eventCenter,
    });
  }

  static async cleanCache() {
    const tmpDir = getTmpDir();
    if (dirExistsSync(tmpDir)) {
      await remove(tmpDir);
    }
  }
}
