import proxyquire from 'proxyquire';
import * as fse from 'fs-extra';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as path from 'path';
import { writeFileSync, readFileSync } from '../src/util/fs';
import { parseRepoURL } from '../src/util/download';
import { getTmpDirPath } from './testUtils';
import { DirectoryCopyWarker } from '../src/util/copyDirContents';

describe('downloadTemplateFromRepo', () => {
  let downloadTemplateFromRepo;
  let downloadStub;
  let cwd;

  let servicePath;
  let newServicePath;
  const copyWalker = new DirectoryCopyWarker();

  beforeEach(() => {
    const tmpDir = getTmpDirPath();
    cwd = process.cwd();

    fse.mkdirsSync(tmpDir);
    process.chdir(tmpDir);

    servicePath = tmpDir;
    newServicePath = path.join(servicePath, 'new-service-name');

    downloadStub = sinon.stub().resolves();

    downloadTemplateFromRepo = proxyquire('../src/util/download', {
      download: downloadStub,
    }).downloadTemplateFromRepo;
  });

  afterEach(() => {
    // change back to the old cwd
    process.chdir(cwd);
  });

  describe('downloadTemplateFromRepo', () => {
    it('should throw an error if the passed URL option is not a valid URL', () => {
      try {
        downloadTemplateFromRepo(copyWalker, 'invalidUrl');
      } catch (err) {
        expect(err).to.be.an.instanceof(Error);
      }
    });

    it('should throw an error if the passed URL is not a valid GitHub URL', () => {
      try {
        downloadTemplateFromRepo(copyWalker, 'http://no-github-url.com/foo/bar');
      } catch (err) {
        expect(err).to.be.an.instanceof(Error);
      }
    });

    it('should throw an error if a directory with the same service name is already present', () => {
      const serviceDirName = path.join(servicePath, 'existing-service');
      fse.mkdirsSync(serviceDirName);

      try {
        downloadTemplateFromRepo(copyWalker, 'https://github.com/johndoe/existing-service');
      } catch (err) {
        expect(err).to.be.an.instanceof(Error);
      }
    });

    it('should download the service based on the GitHub URL', () => {
      const url = 'https://github.com/johndoe/service-to-be-downloaded';

      return downloadTemplateFromRepo(copyWalker, url).then(() => {
        expect(downloadStub.calledOnce).to.equal(true);
        expect(downloadStub.args[0][0]).to.equal(`${url}/archive/master.zip`);
      });
    });

    it('should throw an error if the same service name exists as directory in Github', () => {
      const url = 'https://github.com/serverless/examples/tree/master/rest-api-with-dynamodb';
      const serviceDirName = path.join(servicePath, 'rest-api-with-dynamodb');
      fse.mkdirsSync(serviceDirName);
      try {
        downloadTemplateFromRepo(copyWalker, null, url);
      } catch (err) {
        expect(err).to.be.an.instanceof(Error);
      }
    });

    it('should download and rename the service based on the GitHub URL', () => {
      const url = 'https://github.com/johndoe/service-to-be-downloaded';
      const name = 'new-service-name';

      downloadStub.returns(
        fse.remove(newServicePath)
          .then(() => {
            const sp = downloadStub.args[0][1];
            const slsYml = path.join(
              sp,
              'serverless.yml');
            writeFileSync(slsYml, 'service: service-name');
          }));

      return downloadTemplateFromRepo(copyWalker, url, name).then((serviceName) => {
        expect(downloadStub.calledOnce).to.equal(true);
        expect(downloadStub.args[0][1]).to.contain(name);
        expect(downloadStub.args[0][0]).to.equal(`${url}/archive/master.zip`);
        const yml = readFileSync(path.join(newServicePath, 'serverless.yml'));
        expect(yml.service).to.equal(name);
        expect(serviceName).to.equal('service-to-be-downloaded');
      });
    });

    it('should download and rename the service based directories in the GitHub URL', () => {
      const url = 'https://github.com/serverless/examples/tree/master/rest-api-with-dynamodb';
      const name = 'new-service-name';

      downloadStub.returns(
        fse.remove(newServicePath)
          .then(() => {
            const sp = downloadStub.args[0][1];
            const slsYml = path.join(
              sp,
              'rest-api-with-dynamodb',
              'serverless.yml');
            writeFileSync(slsYml, 'service: service-name');
          }));

      return downloadTemplateFromRepo(copyWalker, url, name).then((serviceName) => {
        expect(downloadStub.calledOnce).to.equal(true);
        const yml = readFileSync(path.join(newServicePath, 'serverless.yml'));
        expect(yml.service).to.equal(name);
        expect(serviceName).to.equal('rest-api-with-dynamodb');
      });
    });
  });

  describe('parseRepoURL', () => {
    it('should throw an error if no URL is provided', () => {
      expect(parseRepoURL).to.throw(Error);
    });

    it('should throw an error if URL is not valid', () => {
      try {
        parseRepoURL('non_valid_url');
      } catch (e) {
        expect(e).to.be.an.instanceOf(Error);
      }
    });

    it('should throw an error if URL is not of valid provider', () => {
      try {
        parseRepoURL('https://kostasbariotis.com/repo/owner');
      } catch (e) {
        expect(e).to.be.an.instanceOf(Error);
      }
    });

    it('should parse a valid GitHub URL', () => {
      const output = parseRepoURL('https://github.com/serverless/serverless');

      expect(output).to.deep.eq({
        owner: 'serverless',
        repo: 'serverless',
        branch: 'master',
        downloadUrl: 'https://github.com/serverless/serverless/archive/master.zip',
        isSubdirectory: false,
        pathToDirectory: '',
      });
    });

    it('should parse a valid GitHub URL with subdirectory', () => {
      const output = parseRepoURL('https://github.com/serverless/serverless/tree/master/assets');

      expect(output).to.deep.eq({
        owner: 'serverless',
        repo: 'serverless',
        branch: 'master',
        downloadUrl: 'https://github.com/serverless/serverless/archive/master.zip',
        isSubdirectory: true,
        pathToDirectory: 'assets',
      });
    });

    it('should parse a valid BitBucket URL ', () => {
      const output = parseRepoURL('https://bitbucket.org/atlassian/localstack');

      expect(output).to.deep.eq({
        owner: 'atlassian',
        repo: 'localstack',
        branch: 'master',
        downloadUrl: 'https://bitbucket.org/atlassian/localstack/get/master.zip',
        isSubdirectory: false,
        pathToDirectory: '',
      });
    });

    it('should parse a valid BitBucket URL with subdirectory', () => {
      const output = parseRepoURL('https://bitbucket.org/atlassian/localstack/src/85870856fd6941ae75c0fa946a51cf756ff2f53a/localstack/dashboard/?at=mvn');

      expect(output).to.deep.eq({
        owner: 'atlassian',
        repo: 'localstack',
        branch: 'mvn',
        downloadUrl: 'https://bitbucket.org/atlassian/localstack/get/mvn.zip',
        isSubdirectory: true,
        pathToDirectory: `localstack${path.sep}dashboard`,
      });
    });

    it('should parse a valid GitLab URL ', () => {
      const output = parseRepoURL('https://gitlab.com/serverless/serverless');

      expect(output).to.deep.eq({
        owner: 'serverless',
        repo: 'serverless',
        branch: 'master',
        downloadUrl: 'https://gitlab.com/serverless/serverless/-/archive/master/serverless-master.zip',
        isSubdirectory: false,
        pathToDirectory: '',
      });
    });

    it('should parse a valid GitLab URL with subdirectory', () => {
      const output = parseRepoURL('https://gitlab.com/serverless/serverless/tree/dev/subdir');

      expect(output).to.deep.eq({
        owner: 'serverless',
        repo: 'serverless',
        branch: 'dev',
        downloadUrl: 'https://gitlab.com/serverless/serverless/-/archive/dev/serverless-dev.zip',
        isSubdirectory: true,
        pathToDirectory: 'subdir',
      });
    });
  });
});
