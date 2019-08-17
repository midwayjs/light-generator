import { CommonGenerator } from './CommonGenerator';
import { dirExistsSync } from '../util/dirExistsSync';
import untildify from 'untildify';
import { fileExistsSync } from '../util/fs';
import { join } from 'path';
import { TemplatePackageConfig } from '../interface';

export class LocalPatternGenerator extends CommonGenerator {

  /**
   * 获取模板配置
   */
  async getTemplateConfig() {
    if (!this.templateConfig) {
      const templateRoot = untildify(this.templateUri);
      const templatePkg = join(templateRoot, 'package.json');

      if (fileExistsSync(templatePkg)) {
        try {
          const pkg = require(templatePkg);
          const config = pkg[ 'boilerplateConfig' ] as TemplatePackageConfig;
          if (config) {
            config.replaceFile = config.replaceFile || [ 'README.md' ];
            if (typeof config.replaceFile === 'string') {
              config.replaceFile = [ config.replaceFile ];
            }
            config.replaceParameter = config.replaceParameter as string || 'index.js';
            config.root = join(templateRoot, config.root || 'boilerplate');
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
    const templateRoot = untildify(this.templateUri);
    const templateConfig = await this.getTemplateConfig() as TemplatePackageConfig;
    if (templateConfig) {
      const parameterFile = join(templateRoot, templateConfig.replaceParameter as string);
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
      if (parameterList[key][ 'default' ]) {
        defaultValue[ key ] = parameterList[key][ 'default' ];
      }
    }
    return defaultValue;
  }

  async run(replaceParameter = {}) {
    // Copying template from a local directory
    const servicePath = untildify(this.targetPath);
    if (dirExistsSync(servicePath)) {
      const errorMessage = `A folder named "${servicePath}" already exists.`;
      throw new Error(errorMessage);
    }

    let templateRoot = untildify(this.templateUri);

    const templateConfig = await this.getTemplateConfig() as TemplatePackageConfig;
    if (templateConfig) {
      templateRoot = templateConfig.root;
      if (!dirExistsSync(templateRoot)) {
        throw new Error(`Directory ${templateRoot} not exist`);
      }
    }

    const defaultArgsValue = await this.getDefaultParameterValue();

    await this.copyWalker.copy(templateRoot, servicePath, {
      replaceParameter: Object.assign(defaultArgsValue, replaceParameter),
      templateConfig,
      noLinks: true,
    });
  }
}
