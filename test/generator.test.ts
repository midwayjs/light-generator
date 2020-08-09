import { LightGenerator } from '../src';
import { join } from 'path';
import {
  remove,
  existsSync,
  readFileSync,
  ensureDirSync,
  writeFileSync,
  writeJSON,
  emptyDir,
} from 'fs-extra';
import assert from 'assert';
import { getTmpDir } from '../src/util/';

async function assertThrowsAsync(fn, regExp) {
  let f = () => {};
  try {
    await fn();
  } catch (e) {
    f = () => {
      throw e;
    };
  } finally {
    assert.throws(f, regExp);
  }
}

describe('/test/generator.test.ts', () => {
  const targetPath = join(__dirname, './tmp');

  beforeEach(async () => {
    await emptyDir(targetPath);
    await LightGenerator.cleanCache();
  });

  afterEach(async () => {
    await emptyDir(targetPath);
    await LightGenerator.cleanCache();
  });

  describe('local generator', () => {
    it('should generate template with no index', async () => {
      const localGenerator = new LightGenerator().defineLocalPath({
        templatePath: join(__dirname, './fixtures/boilerplate-0'),
        targetPath,
      });
      await localGenerator.run();
      assert(existsSync(join(targetPath, 'package.json')));
      assert(existsSync(join(targetPath, 'README.md')));
    });

    it('should generate template with index', async () => {
      const localGenerator = new LightGenerator().defineLocalPath({
        templatePath: join(__dirname, './fixtures/boilerplate-1'),
        targetPath,
      });
      await localGenerator.run({
        name: 'my demo',
        description: 'hello',
        service: 'myService',
      });
      assert(existsSync(join(targetPath, 'test.js')));
      assert(existsSync(join(targetPath, 'package.json')));
      assert(existsSync(join(targetPath, 'src/index.ts')));
      assert(existsSync(join(targetPath, 'myService.js')));
      assert(existsSync(join(targetPath, 'myService_1.js')));

      let contents = readFileSync(join(targetPath, 'test.js'), 'utf-8');
      assert(/my demo/.test(contents));

      contents = readFileSync(join(targetPath, 'README.md'), 'utf-8');
      assert(/my demo/.test(contents));
      assert(/hello/.test(contents));

      contents = readFileSync(join(targetPath, 'myService.js'), 'utf-8');
      assert(/myService/.test(contents));

      contents = readFileSync(join(targetPath, 'myService_1.js'), 'utf-8');
      assert(/myService/.test(contents));
    });

    it('should generate template with custom rule', async () => {
      const localGenerator = new LightGenerator().defineLocalPath({
        templatePath: join(__dirname, './fixtures/boilerplate-3'),
        targetPath,
      });
      await localGenerator.run({
        name: 'my demo',
        description: 'hello',
        service: 'myService',
      });
      assert(existsSync(join(targetPath, 'test.js')));
      assert(existsSync(join(targetPath, 'test_22.js')));
      assert(existsSync(join(targetPath, 'package.json')));
      assert(existsSync(join(targetPath, 'package_22.json')));
      assert(existsSync(join(targetPath, 'src/index.ts')));
      assert(existsSync(join(targetPath, 'src/index_22.ts')));
      assert(existsSync(join(targetPath, 'myService.js')));
      assert(existsSync(join(targetPath, 'myService_22.js')));
      assert(existsSync(join(targetPath, 'myService_1.js')));
      assert(existsSync(join(targetPath, 'myService_1_22.js')));

      // test before
      assert(existsSync(join(targetPath, 'aaaa.js')));
      // test after
      assert(existsSync(join(targetPath, 'tttt.js')));
    });

    it('should generate template with custom root', async () => {
      const localGenerator = new LightGenerator().defineLocalPath({
        templatePath: join(__dirname, './fixtures/boilerplate-2'),
        targetPath,
      });
      await localGenerator.run({
        name: 'my demo',
        description: 'hello',
      });
      assert(existsSync(join(targetPath, 'package.json')));
      assert(existsSync(join(targetPath, 'src/index.ts')));

      const contents = readFileSync(join(targetPath, 'src/index.ts'), 'utf-8');
      assert(/hello/.test(contents));
    });

    it('should generate template in not empty dir', async () => {
      const newTargetPath = join(__dirname, './tmp_new');
      ensureDirSync(newTargetPath);
      writeFileSync(join(newTargetPath, 'a.js'), 'hello');

      const localGenerator = new LightGenerator().defineLocalPath({
        templatePath: join(__dirname, './fixtures/boilerplate-0'),
        targetPath: newTargetPath,
      });

      await assertThrowsAsync(async () => {
        await localGenerator.run();
      }, /A folder named/);

      await remove(newTargetPath);
    });

    it('should generate template in empty dir', async () => {
      const newTargetPath = join(__dirname, './tmp_new');
      ensureDirSync(newTargetPath);

      const localGenerator = new LightGenerator().defineLocalPath({
        templatePath: join(__dirname, './fixtures/boilerplate-0'),
        targetPath: newTargetPath,
      });

      await localGenerator.run();
      assert(existsSync(join(newTargetPath, 'package.json')));
      assert(existsSync(join(newTargetPath, 'README.md')));
      await remove(newTargetPath);
    });
  });

  describe('npm generator', () => {
    it('should generate template by npm pkg', async () => {
      const npmGenerator = new LightGenerator().defineNpmPackage({
        npmPackage: 'egg-boilerplate-simple',
        targetPath,
      });
      await npmGenerator.run({
        name: 'my demo',
        description: 'hello',
      });
      assert(existsSync(join(targetPath, 'package.json')));
      assert(existsSync(join(targetPath, '.autod.conf')));

      await remove(targetPath);

      // if change template and just use cache
      const templateRoot = npmGenerator.getTemplatePath();
      await writeJSON(join(templateRoot, 'index.js'), {
        desc: 'hello world',
      });
      // 第二次执行使用缓存
      await npmGenerator.run();
      const contents = readFileSync(join(targetPath, 'index.js'), 'utf-8');
      assert(/hello world/.test(contents));
    });

    it('should generate template by special npm pkg', async () => {
      const npmGenerator = new LightGenerator().defineNpmPackage({
        npmPackage: '@midwayjs-examples/faas-with-vue',
        targetPath,
      });
      await npmGenerator.run();
      assert(existsSync(join(targetPath, 'package.json')));
      assert(existsSync(join(targetPath, 'src')));
      assert(existsSync(join(targetPath, '.gitignore')));
      assert(existsSync(join(targetPath, 'f.yml')));
    });

    it('should generate template by custom registry', async () => {
      const npmGenerator = new LightGenerator().defineNpmPackage({
        npmPackage: 'egg-boilerplate-simple',
        targetPath,
        registryUrl: 'https://registry.npmjs.org',
      });
      await npmGenerator.run({
        name: 'my demo',
        description: 'hello',
      });
      assert(existsSync(join(targetPath, 'package.json')));
      assert(existsSync(join(targetPath, '.autod.conf')));

      await remove(targetPath);

      // if change template and just use cache
      const templateRoot = npmGenerator.getTemplatePath();
      await writeJSON(join(templateRoot, 'index.js'), {
        desc: 'hello world',
      });
      // 第二次执行使用缓存
      await npmGenerator.run();
      const contents = readFileSync(join(targetPath, 'index.js'), 'utf-8');
      assert(/hello world/.test(contents));
    });

    it.only('should get parameterList from npm package and clean cache', async () => {
      const npmGenerator = new LightGenerator().defineNpmPackage({
        npmPackage: 'egg-boilerplate-simple',
        targetPath,
      });

      const args = await npmGenerator.getParameterList();
      assert(args);
      await LightGenerator.cleanCache();
      assert(!existsSync(getTmpDir()));
    });

    it('shoud gererate directory from npm boilerplate use before and after', async () => {
      const npmGenerator = new LightGenerator().defineNpmPackage({
        npmPackage: '@midwayjs/generator-test-boilerplate',
        targetPath,
      });

      await npmGenerator.run();

      assert(existsSync(join(targetPath, 'src/apis/index.ts')));
      assert(existsSync(join(targetPath, 'f.yml')));
      assert(existsSync(join(targetPath, 'build.json')));
      assert(existsSync(join(targetPath, 'src/pages')));
    });
  });
});
