import { LightGenerator } from '../src';
import { join } from 'path';
import * as fse from 'fs-extra';
import assert from 'assert';
import { tmpdir } from 'os';
import { renamePackageName } from '../src/generator/NpmPatternGenerator';

describe('/test/generator.test.ts', () => {

  const targetPath = join(__dirname, './tmp');

  beforeEach(async () => {
    await fse.remove(targetPath);
  });

  afterEach(async () => {
    await fse.remove(targetPath);
  });

  describe('local generator', () => {
    it('should generate template with no index', async () => {
      const localGenerator = new LightGenerator().defineLocalPath({
        templatePath: join(__dirname, './fixtures/boilerplate-0'),
        targetPath,
      });
      await localGenerator.run();
      assert(fse.existsSync(join(targetPath, 'package.json')));
      assert(fse.existsSync(join(targetPath, 'README.md')));
    });

    it('should generate template with index', async () => {
      const localGenerator = new LightGenerator().defineLocalPath({
        templatePath: join(__dirname, './fixtures/boilerplate-1'),
        targetPath
      });
      await localGenerator.run({
        name: 'my demo',
        description: 'hello'
      });
      assert(fse.existsSync(join(targetPath, 'test.js')));
      assert(fse.existsSync(join(targetPath, 'package.json')));
      assert(fse.existsSync(join(targetPath, 'src/index.ts')));

      let contents = fse.readFileSync(join(targetPath, 'test.js'), 'utf-8');
      assert(/my demo/.test(contents));

      contents = fse.readFileSync(join(targetPath, 'README.md'), 'utf-8');
      assert(/my demo/.test(contents));
      assert(/hello/.test(contents));
    });

    it('should generate template with custom root', async () => {
      const localGenerator = new LightGenerator().defineLocalPath({
        templatePath: join(__dirname, './fixtures/boilerplate-2'),
        targetPath
      });
      await localGenerator.run({
        name: 'my demo',
        description: 'hello'
      });
      assert(fse.existsSync(join(targetPath, 'package.json')));
      assert(fse.existsSync(join(targetPath, 'src/index.ts')));

      const contents = fse.readFileSync(join(targetPath, 'src/index.ts'), 'utf-8');
      assert(/hello/.test(contents));
    });
  });

  describe('npm generator', () => {
    it('should generate template by npm pkg', async () => {
      await fse.remove(join(tmpdir(), 'gen_' + Date.now().toString().slice(0, 5)));
      const npmGenerator = new LightGenerator().defineNpmPackage({
        npmPackage: 'egg-boilerplate-simple',
        targetPath
      });
      await npmGenerator.run({
        name: 'my demo',
        description: 'hello'
      });
      assert(fse.existsSync(join(targetPath, 'package.json')));
      assert(fse.existsSync(join(targetPath, '.autod.conf')));

      await fse.remove(targetPath);

      // if change template and just use cache
      const templateRoot = npmGenerator.getTemplatePath();
      await fse.writeJSON(join(templateRoot, 'index.js'), {
        desc: 'hello world'
      });
      // 第二次执行使用缓存
      await npmGenerator.run();
      const contents = fse.readFileSync(join(targetPath, 'index.js'), 'utf-8');
      assert(/hello world/.test(contents));
    });

    it('should get parameterList from npm package', async () => {
      const npmGenerator = new LightGenerator().defineNpmPackage({
        npmPackage: 'egg-boilerplate-simple',
        targetPath
      });

      const args = await npmGenerator.getParameterList();
      assert(args);
    });

    it('should transform package name', () => {
      assert(renamePackageName('@ali/midway') === 'ali-midway');
      assert(renamePackageName('@ali.midway') === '@ali.midway');
      assert(renamePackageName('@scope/midway') === 'scope-midway');
    });
  });
});
