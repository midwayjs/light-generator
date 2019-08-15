import * as path from 'path';
import * as fse from 'fs-extra';
import { walkDirSync } from './walkDirSync';
import { CopyRule, CopyWalker } from '../interface';

export class DirectoryCopyWarker implements CopyWalker {

  rules;

  constructor(rules: CopyRule[] = []) {
    this.rules = rules;
  }

  async copy(srcDir, destDir, options = {}) {
    const fullFilesPaths = walkDirSync(srcDir, options);

    for (const fullFilePath of fullFilesPaths) {
      const relativeFilePath = fullFilePath.replace(srcDir, '');
      const targetFilePath = path.join(destDir, relativeFilePath);
      await fse.copy(fullFilePath, path.join(destDir, relativeFilePath));
      for (const rule of this.rules) {
        await rule(targetFilePath);
      }
    }
  }
}
