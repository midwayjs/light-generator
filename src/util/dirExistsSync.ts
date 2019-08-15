import * as fse from 'fs-extra';

export function dirExistsSync(dirPath) {
  try {
    const stats = fse.statSync(dirPath);
    return stats.isDirectory();
  } catch (e) {
    return false;
  }
}
