import * as path from 'path';
import * as fse from 'fs-extra';
import { walkDirSync } from './walkDirSync';
import { CopyRule, CopyWalker, TemplatePackageConfig } from '../interface';
const debug = require('util').debuglog('generator');

export class DirectoryCopyWalker implements CopyWalker {

  rules;

  constructor(options: {
    rules?: CopyRule[]
  } = {}) {
    this.rules = options.rules || [];
  }

  addCopyRule(rule: CopyRule) {
    this.rules.push(rule);
  }

  async copy(srcDir, destDir, options: {
    packageRoot?: string;
    replaceParameter: object;
    templateConfig: Partial<TemplatePackageConfig>;
  } = {
    replaceParameter: {},
    templateConfig: {}
  }) {
    const fullFilesPaths = walkDirSync(srcDir, options);
    const filenameMapping = new Map();

    // add custom rule
    if (options.templateConfig.rule && options.templateConfig.rule.length) {
      for (const rule of options.templateConfig.rule) {
        try {
          const copyRule = path.isAbsolute(rule) ? require(rule) : require(path.join(options.packageRoot, rule));
          this.addCopyRule(copyRule);
        } catch (err) {
          throw new Error(`load custom rule error, path = ${rule}`);
        }
      }
    }

    for (const fullFilePath of fullFilesPaths) {
      const relativeFilePath = path.relative(srcDir, fullFilePath);
      const targetFilePath = path.join(destDir, relativeFilePath);
      await fse.copy(fullFilePath, path.join(destDir, relativeFilePath));
      debug(`-> ${relativeFilePath}`);
      for (const rule of this.rules) {
        await rule(targetFilePath, {
          templateDir: srcDir,
          targetDir: destDir,
          replaceParameter: options.replaceParameter,
          targetRelativeFile: relativeFilePath,
          templateConfig: options.templateConfig || {
            root: destDir,
            replaceFile: [],
            replaceParameter: {},
            rule: []
          },
          filenameMapping,
        });
      }
    }
  }
}
