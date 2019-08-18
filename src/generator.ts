import { DirectoryCopyWalker } from './util/copyDirContents';
import { CopyRule, CopyWalker } from './interface';
import { NpmPatternGenerator } from './generator/NpmPatternGenerator';
import { UrlPatternGenerator } from './generator/UrlPatternGenerator';
import { LocalPatternGenerator } from './generator/LocalPatternGenerator';
import { ignoreRule, replaceRule } from './rule';

export class LightGenerator {

  options;
  copyWalker: CopyWalker;

  constructor(options: {
    disableDefaultRule: boolean;
    copyRule?: CopyRule[];
  } = { disableDefaultRule: false }) {
    this.options = options;
    this.copyWalker = new DirectoryCopyWalker(this.options);
    if (!this.options.disableDefaultRule) {
      this.addDefaultCopyRule();
    }
  }

  addDefaultCopyRule() {
    this.copyWalker.addCopyRule(replaceRule);
    this.copyWalker.addCopyRule(ignoreRule);
  }

  defineLocalPath(options: { templateName?: string; templatePath: string; targetPath: string; }) {
    return new LocalPatternGenerator({
      templateUri: options.templatePath,
      targetPath: options.targetPath,
      templateName: options.templateName,
      copyWalker: this.copyWalker,
    });
  }

  defineRemoteUrl(options: { templateUrl: string; targetPath: string; templateName: string; }) {
    return new UrlPatternGenerator({
      templateUri: options.templateUrl,
      targetPath: options.targetPath,
      templateName: options.templateName,
      copyWalker: this.copyWalker,
    });
  }

  defineNpmPackage(options: { npmPackage: string; targetPath: string; npmClient?: string; }) {
    return new NpmPatternGenerator({
      templateUri: options.npmPackage,
      targetPath: options.targetPath,
      copyWalker: this.copyWalker,
      npmClient: options.npmClient || 'npm'
    });
  }

}
