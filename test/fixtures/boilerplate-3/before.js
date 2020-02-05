'use strict';

const fse = require('fs-extra');
const path = require('path');

module.exports = async options => {
  await fse.writeFile(path.join(options.targetRoot, 'aaaa.js'), 'test');
};
