import { CommonGeneratorOptions, CopyWalker, TemplatePackageConfig } from '../interface';

export abstract class CommonGenerator {

  copyWalker: CopyWalker;
  templateUri: string;
  targetPath: string;
  templateName: string;
  templateConfig: TemplatePackageConfig;

  constructor(options: CommonGeneratorOptions) {
    this.templateUri = options.templateUri;
    this.targetPath = options.targetPath;
    this.copyWalker = options.copyWalker;
    this.templateName = options.templateName;
  }

  abstract async getParameterList();

  abstract async run();
}
