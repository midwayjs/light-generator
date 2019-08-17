import * as URL from 'url';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { dirExistsSync } from './dirExistsSync';
import download from 'download';
import * as qs from 'querystring';
import { renameService } from './renameService';
import { CopyWalker } from '../interface';

/**
 * Returns directory path
 * @param {Number} length
 * @param {Array} parts
 * @returns {String} directory path
 */
function getPathDirectory(length, parts) {
  if (!parts) {
    return '';
  }
  return parts
    .slice(length)
    .filter(part => part !== '')
    .join(path.sep);
}

/**
 * Validates URL
 * @param {Object} url
 * @param {String} hostname
 * @param {String} service
 * @param {String} owner
 * @param {String} repo
 */
function validateUrl(url, hostname, service, owner, repo) {
    // validate if given url is a valid url
  if (url.hostname !== hostname || !owner || !repo) {
    const errorMessage = `The URL must be a valid ${
        service
      } URL in the following format: https://${
        hostname
      }/serverless/serverless`;
    throw new Error(errorMessage);
  }
}

/**
 * @param {Object} url
 * @returns {Object}
 */
function parseGitHubURL(url) {
  const pathLength = 4;
  const parts = url.pathname.split('/');
  const isSubdirectory = parts.length > pathLength;
  const owner = parts[1];
  const repo = parts[2];
  const branch = isSubdirectory ? parts[pathLength] : 'master';

  // validate if given url is a valid GitHub url
  validateUrl(url, 'github.com', 'GitHub', owner, repo);

  const downloadUrl = `https://${url.auth ? `${url.auth}@` : ''}github.com/${owner}/${repo}/archive/${branch}.zip`;

  return {
    owner,
    repo,
    branch,
    downloadUrl,
    isSubdirectory,
    pathToDirectory: getPathDirectory(pathLength + 1, parts),
  };
}

/**
 * @param {Object} url
 * @returns {Object}
 */
function parseBitbucketURL(url) {
  const pathLength = 4;
  const parts = url.pathname.split('/');
  const isSubdirectory = parts.length > pathLength;
  const owner = parts[1];
  const repo = parts[2];

  const query = qs.parse(url.query);
  const branch = 'at' in query ? query.at : 'master';

  // validate if given url is a valid Bitbucket url
  validateUrl(url, 'bitbucket.org', 'Bitbucket', owner, repo);

  const downloadUrl = `https://bitbucket.org/${owner}/${repo}/get/${branch}.zip`;

  return {
    owner,
    repo,
    branch,
    downloadUrl,
    isSubdirectory,
    pathToDirectory: getPathDirectory(pathLength + 1, parts),
  };
}

/**
 * @param {Object} url
 * @returns {Object}
 */
function parseGitlabURL(url) {
  const pathLength = 4;
  const parts = url.pathname.split('/');
  const isSubdirectory = parts.length > pathLength;
  const owner = parts[1];
  const repo = parts[2];

  const branch = isSubdirectory ? parts[pathLength] : 'master';

  // validate if given url is a valid GitLab url
  validateUrl(url, 'gitlab.com', 'Bitbucket', owner, repo);

  const downloadUrl = `https://gitlab.com/${owner}/${repo}/-/archive/${branch}/${repo}-${branch}.zip`;

  return {
    owner,
    repo,
    branch,
    downloadUrl,
    isSubdirectory,
    pathToDirectory: getPathDirectory(pathLength + 1, parts),
  };
}

/**
 * Parse URL and call the appropriate adaptor
 *
 * @param {string} inputUrl
 * @throws {ServerlessError}
 * @returns {Object}
 */
export function parseRepoURL(inputUrl) {
  if (!inputUrl) {
    throw new Error('URL is required');
  }

  const url = URL.parse(inputUrl.replace(/\/$/, ''));

  // check if url parameter is a valid url
  if (!url.host) {
    throw new Error('The URL you passed is not a valid URL');
  }

  switch (url.hostname) {
    case 'github.com': {
      return parseGitHubURL(url);
    }
    case 'bitbucket.org': {
      return parseBitbucketURL(url);
    }
    case 'gitlab.com': {
      return parseGitlabURL(url);
    }
    default: {
      const msg =
        'The URL you passed is not one of the valid providers: "GitHub", "Bitbucket", or "GitLab".';
      throw new Error(msg);
    }
  }
}

export async function downloadTemplateFromRepo(copyWalker: CopyWalker, inputUrl: string, templateName: string, downloadPath: string) {
  const repoInformation = parseRepoURL(inputUrl);

  let serviceName;
  let dirName;
  let downloadServicePath;

  if (repoInformation.isSubdirectory) {
    const folderName = repoInformation.pathToDirectory.split('/').splice(-1)[0];
    serviceName = folderName;
    dirName = downloadPath || templateName || folderName;
    downloadServicePath = path.join(os.tmpdir(), repoInformation.repo);
  } else {
    serviceName = repoInformation.repo;
    dirName = downloadPath || templateName || repoInformation.repo;
    downloadServicePath = path.join(process.cwd(), dirName);
  }

  const servicePath = path.join(process.cwd(), dirName);
  const renamed = dirName !== repoInformation.repo;

  if (dirExistsSync(path.join(process.cwd(), dirName))) {
    const errorMessage = `A folder named "${dirName}" already exists.`;
    throw new Error(errorMessage);
  }

  console.log(`Downloading and installing "${serviceName}"...`);

  // download service
  await download(
    repoInformation.downloadUrl,
    downloadServicePath,
    { timeout: 30000, extract: true, strip: 1, mode: '755' }
  );

  // if it's a directory inside of git
  if (repoInformation.isSubdirectory) {
    const directory = path.join(downloadServicePath, repoInformation.pathToDirectory);
    await copyWalker.copy(directory, servicePath);
    await fse.remove(downloadServicePath);
  }
  if (renamed) { renameService(dirName, servicePath); }
  return serviceName;
}
