import assert from 'assert';
import { renamePackageName } from '../src/util/';

describe('/test/util.test.ts', () => {
  it('should transform package name', () => {
    assert(renamePackageName('@ali/midway') === 'ali-midway');
    assert(renamePackageName('@ali.midway') === '@ali.midway');
    assert(renamePackageName('@scope/midway') === 'scope-midway');
  });
});
