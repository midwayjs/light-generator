import * as fse from 'fs-extra';

export function fileExistsSync(filePath) {
  try {
    const stats = fse.lstatSync(filePath);
    return stats.isFile();
  } catch (e) {
    return false;
  }
}

export function dirExistsSync(dirPath) {
  try {
    const stats = fse.statSync(dirPath);
    return stats.isDirectory();
  } catch (e) {
    return false;
  }
}

export function readFileSync(filePath) {
  const contents = fse.readFileSync(filePath, 'utf8');
  if (filePath.endsWith('.json')) {
    return JSON.parse(contents);
  }
  return contents;
}
