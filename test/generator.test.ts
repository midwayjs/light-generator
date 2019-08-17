import { LightGenerator } from '../src';
import { join } from 'path';
import * as fse from 'fs-extra';
import assert from 'assert';

describe('/test/generator.test.ts', () => {

  const targetPath = join(__dirname, './tmp');

  beforeEach(async () => {
    await fse.remove(targetPath);
  });

  afterEach(async () => {
    await fse.remove(targetPath);
  });

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
