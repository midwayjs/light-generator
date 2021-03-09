import {
  CommonGeneratorOptions,
  CopyWalker,
  GeneratorEventEnum,
  TemplatePackageConfig,
} from '../interface';
import { isAbsolute, join, normalize } from 'path';
import { dirExistsSync, fileExistsSync, readFileSync } from '../util/fs';
import { ensureDir } from 'fs-extra';
import untildify from 'untildify';
import emptyDir from 'empty-dir';
import EventEmitter from 'events';

export abstract class CommonGenerator {
  copyWalker: CopyWalker;
  templateUri: string;
  targetPath: string;
  templateName: string;
  templateConfig: TemplatePackageConfig;
  eventCenter: EventEmitter;

  constructor(options: CommonGeneratorOptions) {
    this.templateUri = options.templateUri;
    this.targetPath = options.targetPath;
    this.copyWalker = options.copyWalker;
    this.templateName = options.templateName;
    this.eventCenter = options.eventCenter;
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

            // normalize path for windows
            config.replaceFile = config.replaceFile.map(item => {
              return normalize(item);
            });

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
    } else {
      // create
      await ensureDir(servicePath);
    }

    let templateConfig = (await this.getTemplateConfig()) as Partial<TemplatePackageConfig>;
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

    this.eventCenter.emit(GeneratorEventEnum.onTemplateReady);

    const defaultArgsValue = await this.getDefaultParameterValue();
    replaceParameter = Object.assign(defaultArgsValue, replaceParameter);

    if (templateConfig.beforeAll) {
      await this.runScript(packageRoot, templateConfig.beforeAll, {
        sourceRoot: packageRoot,
        templateRoot,
        targetRoot: servicePath,
        replaceParameter,
        templateConfig,
      });
    }

    await this.copyWalker.copy(templateRoot, servicePath, {
      packageRoot,
      replaceParameter,
      templateConfig,
      noLinks: true,
    });

    if (templateConfig.afterAll) {
      await this.runScript(packageRoot, templateConfig.afterAll, {
        sourceRoot: packageRoot,
        templateRoot,
        targetRoot: servicePath,
        replaceParameter,
        templateConfig,
      });
    }
  }

  async runScript(
    packageRoot: string,
    runString: string,
    runArgs: Record<string, unknown>
  ) {
    const fn = isAbsolute(runString)
      ? require(runString)
      : require(join(packageRoot, runString));
    if (fn && typeof fn === 'function') {
      await fn(runArgs);
    }
  }

  onTemplateReady(handler: () => void) {
    this.eventCenter.on(GeneratorEventEnum.onTemplateReady, handler);
  }

  onFileCreated(
    handler: (data: {
      sourceFullFilePath: string;
      targetFullFilePath: string;
      destDir: string;
      relativeFilePath: string;
    }) => void
  ) {
    this.eventCenter.on(GeneratorEventEnum.onFileCreate, handler);
  }

  abstract getTemplatePath(): string;
}
