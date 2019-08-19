import * as path from 'path';
import * as fse from 'fs-extra';
import { walkDirSync } from './walkDirSync';
import { CopyRule, CopyWalker } from '../interface';

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

  async copy(srcDir, destDir, options = {
    replaceParameter: {},
    templateConfig: {}
  }) {
    const fullFilesPaths = walkDirSync(srcDir, options);

    for (const fullFilePath of fullFilesPaths) {
      const relativeFilePath = path.relative(srcDir, fullFilePath);
      const targetFilePath = path.join(destDir, relativeFilePath);
      await fse.copy(fullFilePath, path.join(destDir, relativeFilePath));
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
          }
        });
      }
    }
  }
}
