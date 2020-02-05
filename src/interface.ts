export type CopyRule = (
  currentFile: string,
  copyRuleOptions: CopyRuleOptions
) => void;

export interface CopyWalker {
  addCopyRule(copyRule: CopyRule);
  copy(srcDir, destDir, options?);
}

export interface CommonGeneratorOptions {
  templateUri: string;
  targetPath: string;
  templateName?: string;
  copyWalker: CopyWalker;
}

export interface NpmGeneratorOptions extends CommonGeneratorOptions {
  npmClient?: string;
  registryUrl?: string;
}

export interface TemplatePackageConfig {
  root: string;
  replaceFile: string[];
  replaceParameter: string | object;
  rule: string[];
  beforeAll: string;
  afterAll: string;
}

export interface CopyRuleOptions {
  templateDir: string;
  targetDir: string;
  targetRelativeFile: string;
  replaceParameter: object;
  templateConfig: TemplatePackageConfig;
  filenameMapping: Map<string, string>;
}
