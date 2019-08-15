import * as YAML from 'js-yaml';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';

export const tmpDirCommonPath = path.join(
  os.tmpdir(),
  'tmpdirs-serverless',
  crypto.randomBytes(2).toString('hex')
);

export function getTmpDirPath() {
  return path.join(tmpDirCommonPath, crypto.randomBytes(8).toString('hex'));
}

export function getTmpFilePath(fileName) {
  return path.join(getTmpDirPath(), fileName);
}

export function createTmpDir() {
  const dirPath = getTmpDirPath();
  fse.ensureDirSync(dirPath);
  return dirPath;
}

export function createTmpFile(name) {
  const filePath = getTmpFilePath(name);
  fse.ensureFileSync(filePath);
  return filePath;
}

export function replaceTextInFile(filePath, subString, newSubString) {
  const fileContent = fs.readFileSync(filePath).toString();
  fs.writeFileSync(filePath, fileContent.replace(subString, newSubString));
}

export function readYamlFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return YAML.safeLoad(content);
}

export function writeYamlFile(filePath, content) {
  const yaml = YAML.safeDump(content);
  fs.writeFileSync(filePath, yaml);
  return yaml;
}
