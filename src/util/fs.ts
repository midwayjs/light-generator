import * as fse from 'fs-extra';
import * as path from 'path';
import * as jc from 'json-cycle';
import * as YAML from 'js-yaml';
import { parse } from './parse';

export function fileExistsSync(filePath) {
  try {
    const stats = fse.lstatSync(filePath);
    return stats.isFile();
  } catch (e) {
    return false;
  }
}

export function readFileSync(filePath) {
  const contents = fse.readFileSync(filePath);
  return parse(filePath, contents);
}

export function writeFileSync(filePath, conts, cycles?) {
  let contents = conts || '';

  fse.mkdirsSync(path.dirname(filePath));

  if (filePath.indexOf('.json') !== -1 && typeof contents !== 'string') {
    if (cycles) {
      contents = jc.stringify(contents, null, 2);
    } else {
      contents = JSON.stringify(contents, null, 2);
    }
  }

  const yamlFileExists = (filePath.indexOf('.yaml') !== -1);
  const ymlFileExists = (filePath.indexOf('.yml') !== -1);

  if ((yamlFileExists || ymlFileExists) && typeof contents !== 'string') {
    contents = YAML.dump(contents);
  }

  return fse.writeFileSync(filePath, contents);
}
