// Reproduce defects in the untouched supplied source, against a disposable DB.
// This script requires work/original/github and is not part of release CI.
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const directory = await mkdtemp(join(tmpdir(), 'vera-baseline-'));
process.env.TURSO_DATABASE_URL = '';
process.env.TURSO_AUTH_TOKEN = '';
process.env.RENDER = '';
process.env.VERA_DB = join(directory, 'baseline.sqlite');
const storageURL = new URL('../storage.mjs', import.meta.url).href;
async function original(name) {
  const source = (await readFile(new URL('../../original/github/' + name, import.meta.url), 'utf8'))
    .replaceAll("'./storage.mjs'", JSON.stringify(storageURL)).replaceAll('"./storage.mjs"', JSON.stringify(storageURL));
  return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}
const { db } = await import('../storage.mjs');
try {
  const { journal } = await original('journal.mjs');
  const { account, authorize, consume } = await original('accounts.mjs');
  const rec = id => ({ id, kind: 'Sueño', date: '2026-11-21', value: 8 });
  await assert.rejects(() => journal('partial', { updates: [
    { id: 'first_entry', rev: 0, record: rec('first_entry') },
    { id: '!', rev: 0, record: rec('!') }
  ] }));
  assert.equal((await journal('partial', {})).records.length, 1);
  console.log('REPRODUCED · escritura parcial pese a respuesta de error');
  await journal('invalid', { updates: [{ id: 'bad_date', rev: 0, record: { ...rec('bad_date'), date: '2026-02-30', value: -12 } }] });
  assert.equal((await journal('invalid', {})).records[0].record.value, -12);
  console.log('REPRODUCED · fecha 30 de febrero y sueño negativo persistidos');
  const d = { email: 'baseline@example.invalid', password: 'baseline-test-only-password', adult: true, notice: 'beta-3' };
  const user = await account('/register', d, 'original');
  assert.equal(await authorize(user.token), user.id);
  console.log('REPRODUCED · token desnudo admitido sin esquema Bearer');
  for (let i = 0; i < 40; i++) await assert.rejects(() => account('/login', {}, 'rate'));
  await assert.rejects(() => account('/login', {}, 'rate'), e => e.status === undefined);
  console.log('REPRODUCED · rate limit sin status429 (server original responde400)');
  process.env.VERA_DAILY_LIMIT = '1.5';
  await consume('fractional');
  await consume('fractional');
  console.log('REPRODUCED · configuración fraccionaria de cuota acepta dos consumos');
} finally {
  db.close();
  await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
