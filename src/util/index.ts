import { join } from 'path';
import { tmpdir } from 'os';

export function getTmpDir() {
  return join(tmpdir(), 'gen_' + Date.now().toString().slice(0, 5));
}

export function renamePackageName(pkgName) {
  return pkgName.replace(/^@/, '').replace(/\//g, '-');
}
