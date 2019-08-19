import * as fse from 'fs-extra';
import { CopyRuleOptions } from './interface';
import { join } from 'path';

/**
 * 移除文件下划线
 * @param currentFilePath
 */
export const ignoreRule = async (currentFilePath, copyRuleOptions: CopyRuleOptions) => {
  if (/^_/.test(copyRuleOptions.targetRelativeFile)) {
    await fse.rename(currentFilePath, join(copyRuleOptions.targetDir, copyRuleOptions.targetRelativeFile.replace('_', '')));
  }
};

const pattern = /\{\{(\w*[:]*[=]*\w+)\}\}(?!})/g;

/**
 * 替换文本内容包含 {{}} 的字符串模板
 * @param currentFilePath
 * @param copyRuleOptions
 */
export const replaceRule = async (currentFilePath, copyRuleOptions: CopyRuleOptions) => {
  const replaceArgs = copyRuleOptions.replaceParameter || {};
  if (copyRuleOptions.templateConfig.replaceFile.includes(copyRuleOptions.targetRelativeFile)) {
    const contents = fse.readFileSync(currentFilePath, 'utf-8')
      .replace(pattern, (match, key, value) => {
        return replaceArgs[ key ];
      });

    return fse.writeFileSync(currentFilePath, contents);
  }
};
