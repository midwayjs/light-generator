import * as fse from 'fs-extra';

export const ignoreRule = async (currentFilePath) => {
  if (/^_/.test(currentFilePath)) {
    await fse.rename(currentFilePath, currentFilePath.replace('_', ''));
  }
};

export const replaceRule = async (currentFilePath) => {
  if (/^_/.test(currentFilePath)) {
    await fse.rename(currentFilePath, currentFilePath.replace('_', ''));
  }
};
