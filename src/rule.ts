import * as fse from 'fs-extra';
import { CopyRuleOptions } from './interface';
import { join, relative, basename } from 'path';
import minimatch from 'minimatch';
const debug = require('util').debuglog('generator');

/**
 * 移除文件下划线
 * @param currentFilePath
 */
export const ignoreRule = async (
  currentFilePath,
  copyRuleOptions: CopyRuleOptions
) => {
  const filename = basename(copyRuleOptions.targetRelativeFile);
  if (/^_/.test(filename)) {
    if (copyRuleOptions.filenameMapping.has(currentFilePath)) {
      // 如果名字被修改过，拿新的名字去替换
      const newFilePath = copyRuleOptions.filenameMapping.get(currentFilePath);
      const newName = join(
        copyRuleOptions.targetDir,
        relative(copyRuleOptions.targetDir, newFilePath).replace('_', '')
      );
      await fse.rename(newFilePath, newName);
      copyRuleOptions.filenameMapping.set(currentFilePath, newName);
      debug(` * remove _ => ${newName}`);
    } else {
      const newName = join(
        copyRuleOptions.targetDir,
        copyRuleOptions.targetRelativeFile.replace('_', '')
      );
      await fse.rename(currentFilePath, newName);
      copyRuleOptions.filenameMapping.set(currentFilePath, newName);
      debug(` * remove _ => ${newName}`);
    }
  }
};

const pattern = /\{\{(\w*[:]*[=]*\w+)\}\}(?!})/g;

/**
 * 替换文本内容包含 {{}} 的字符串模板
 * @param currentFilePath
 * @param copyRuleOptions
 */
export const replaceRule = async (
  currentFilePath,
  copyRuleOptions: CopyRuleOptions
) => {
  const replaceArgs = copyRuleOptions.replaceParameter || {};
  if (
    includeReplaceContent(
      copyRuleOptions.templateConfig.replaceFile,
      copyRuleOptions.targetRelativeFile
    )
  ) {
    // 如果当前文件在替换列表中，则进行内容替换
    const contents = fse
      .readFileSync(currentFilePath, 'utf-8')
      .replace(pattern, (match, key, value) => {
        debug(` * replace content key => ${key}`);
        return replaceArgs[key] || match;
      });

    await fse.writeFile(currentFilePath, contents);
  }

  // 如果文件名需要替换
  if (new RegExp(pattern).test(currentFilePath)) {
    const newFilePath = currentFilePath.replace(
      pattern,
      (match, key, value) => {
        debug(` * replace filename key => ${key}`);
        return replaceArgs[key];
      }
    );
    await fse.move(currentFilePath, newFilePath);
    // 一定要更新文件名，不然后续处理找不到
    copyRuleOptions.filenameMapping.set(currentFilePath, newFilePath);
  }
};

// 匹配是否需要替换内容
function includeReplaceContent(
  replaceFilePatternList: string[],
  targetRelativeFile
) {
  for (const pattern of replaceFilePatternList) {
    if (typeof pattern === 'string' && !/\*/.test(pattern)) {
      if (pattern === targetRelativeFile) {
        return true;
      }
    } else {
      const result = minimatch(targetRelativeFile, pattern, {
        matchBase: true,
      });
      if (result) {
        return true;
      }
    }
  }

  return false;
}
