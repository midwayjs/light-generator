import {
  CommonGeneratorOptions,
  CopyWalker,
  TemplatePackageConfig,
} from '../interface';
import { isAbsolute, join } from 'path';
import { dirExistsSync, fileExistsSync, readFileSync } from '../util/fs';
import untildify from 'untildify';
import emptyDir from 'empty-dir';

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

  /**
   * 获取模板配置
   */
  async getTemplateConfig() {
    if (!this.templateConfig) {
      const templateRoot = this.getTemplatePath();
      const templatePkg = join(templateRoot, 'package.json');

      if (fileExistsSync(templatePkg)) {
        try {
          const pkg = readFileSync(templatePkg);
          const config = pkg['boilerplateConfig'] as TemplatePackageConfig;
          if (config) {
            config.replaceFile = config.replaceFile || ['README.md'];
            if (typeof config.replaceFile === 'string') {
              config.replaceFile = [config.replaceFile];
            }
            config.replaceParameter =
              (config.replaceParameter as string) || 'index.js';
            config.root = join(templateRoot, config.root || 'boilerplate');
            config.rule = config.rule || [];
            this.templateConfig = config;
          }
        } catch (err) {
          console.log('boilerplate package.json is not custom format and skip');
        }
      }
    }
    return this.templateConfig;
  }

  /**
   * 获取参数列表
   */
  async getParameterList() {
    const templateConfig = (await this.getTemplateConfig()) as TemplatePackageConfig;
    const templateRoot = this.getTemplatePath();
    if (templateConfig) {
      const parameterFile = join(
        templateRoot,
        templateConfig.replaceParameter as string
      );
      if (fileExistsSync(parameterFile)) {
        return require(parameterFile);
      }
    }
    return {};
  }

  /**
   * 获取参数默认值
   */
  async getDefaultParameterValue() {
    const parameterList = await this.getParameterList();
    const defaultValue = {};
    for (const key in parameterList) {
      if (parameterList[key]['default']) {
        defaultValue[key] = parameterList[key]['default'];
      }
    }
    return defaultValue;
  }

  async run(replaceParameter = {}) {
    // Copying template from a local directory
    const servicePath = untildify(this.targetPath);
    if (dirExistsSync(servicePath)) {
      const checkResult = await emptyDir(servicePath);
      if (!checkResult) {
        const errorMessage = `A folder named "${servicePath}" already exists.`;
        throw new Error(errorMessage);
      }
    }

    let templateConfig = (await this.getTemplateConfig()) as Partial<
      TemplatePackageConfig
    >;
    let templateRoot = this.getTemplatePath();
    const packageRoot = templateRoot;
    if (templateConfig) {
      templateRoot = templateConfig.root;
      if (!dirExistsSync(templateRoot)) {
        throw new Error(`Directory ${templateRoot} not exist`);
      }
    } else {
      templateConfig = {
        replaceParameter: 'index.js',
        root: templateRoot,
        replaceFile: ['README.md'],
        rule: [],
      };
    }

    const defaultArgsValue = await this.getDefaultParameterValue();

    await this.copyWalker.copy(templateRoot, servicePath, {
      packageRoot,
      replaceParameter: Object.assign(defaultArgsValue, replaceParameter),
      templateConfig,
      noLinks: true,
    });

    if (templateConfig.afterAll) {
      const afterScript = isAbsolute(templateConfig.afterAll)
        ? require(templateConfig.afterAll)
        : require(join(packageRoot, templateConfig.afterAll));
      if (afterScript && typeof afterScript === 'function') {
        await afterScript({
          sourceRoot: packageRoot,
          templateRoot,
          targetRoot: servicePath,
          replaceParameter: Object.assign(defaultArgsValue, replaceParameter),
          templateConfig,
        });
      }
    }
  }

  abstract getTemplatePath(): string;
}
