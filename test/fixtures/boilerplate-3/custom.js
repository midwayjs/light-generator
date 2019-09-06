'use strict';

const fse = require('fs-extra');
const path = require('path');

module.exports = async (currentFilePath, copyRuleOptions) => {
  let newFilePath = currentFilePath;
  if (copyRuleOptions.filenameMapping.has(currentFilePath)) {
    newFilePath = copyRuleOptions.filenameMapping.get(currentFilePath);
  }

  const pathObject = path.parse(newFilePath);
  const newPath = path.join(pathObject.dir, pathObject.name + '_22' + pathObject.ext);
  await fse.copy(newFilePath, newPath);
};
