import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { scryptSync, randomBytes } from 'node:crypto';

const directory = await mkdtemp(join(tmpdir(), 'vera-owner-audit-'));
const credentialFile = join(directory, 'synthetic-owner.json');
const password = randomBytes(24).toString('hex');
const salt = randomBytes(16).toString('hex');
const credentials = { email: 'synthetic-owner@example.invalid', salt,
  hash: scryptSync(password, salt, 64).toString('hex') };
const source = (await readFile(new URL('../owner.mjs', import.meta.url), 'utf8'))
  .replace('new URL("./owner.json",import.meta.url)', `new URL(${JSON.stringify(pathToFileURL(credentialFile).href)})`);
async function moduleFor(flag) {
  process.env.VERA_ALLOW_LEGACY_OWNER_FILE = flag;
  return import('data:text/javascript;base64,' + Buffer.from(source + '\n//' + randomBytes(8).toString('hex')).toString('base64'));
}
for (const prefix of ['OWNER', 'EDITOR', 'ANALYST']) {
  delete process.env['VERA_' + prefix + '_EMAIL'];
  delete process.env['VERA_' + prefix + '_PASSWORD'];
}
try {
  await writeFile(credentialFile, JSON.stringify(credentials));
  const disabled = await moduleFor('');
  await assert.rejects(() => disabled.ownerLogin({ email: credentials.email, password }, 'disabled'), e => e.status === 401);
  console.log('PASS · credenciales heredadas válidas se rechazan por defecto');
  const enabled = await moduleFor('true');
  assert.equal((await enabled.ownerLogin({ email: credentials.email, password }, 'enabled')).role, 'propietario');
  await assert.rejects(() => enabled.ownerLogin({ email: credentials.email, password: 'wrong-password' }, 'wrong'), e => e.status === 401);
  console.log('PASS · compatibilidad heredada requiere opt-in explícito y contraseña correcta');
  await writeFile(credentialFile, JSON.stringify({ ...credentials, hash: 'bad-hash' }));
  const malformed = await moduleFor('true');
  await assert.rejects(() => malformed.ownerLogin({ email: credentials.email, password }, 'malformed'), e => e.status === 401);
  console.log('PASS · hash heredado inválido deniega acceso sin error interno');
  process.env.VERA_ALLOW_LEGACY_OWNER_FILE = '';
} finally {
  await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
