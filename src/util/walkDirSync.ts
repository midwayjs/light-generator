import * as path from 'path';
import * as fse from 'fs-extra';

export function walkDirSync(dirPath, opts) {
  const options = Object.assign(
    {
      noLinks: false,
    },
    opts
  );
  let filePaths = [];
  const list = fse.readdirSync(dirPath);
  list.forEach(filePathParam => {
    let filePath = filePathParam;
    filePath = path.join(dirPath, filePath);
    const stat = options.noLinks
      ? fse.lstatSync(filePath)
      : fse.statSync(filePath);
    // skipping symbolic links when noLinks option
    if (options.noLinks && stat && stat.isSymbolicLink()) {
      return;
    } else if (stat && stat.isDirectory()) {
      filePaths = filePaths.concat(walkDirSync(filePath, opts));
    } else {
      filePaths.push(filePath);
    }
  });

  return filePaths;
}
