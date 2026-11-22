import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Every test uses a new local database; never use deployment credentials.
const directory = await mkdtemp(join(tmpdir(), 'vera-audit-backend-'));
process.env.TURSO_DATABASE_URL = '';
process.env.TURSO_AUTH_TOKEN = '';
process.env.RENDER = '';
process.env.VERA_DB = join(directory, 'audit.sqlite');
const { db, rows } = await import('../storage.mjs');
const { journal } = await import('../journal.mjs');
const { account, authorize, logout, nickname, consume, releaseQuota } = await import('../accounts.mjs');
const { partnerAction } = await import('../partners.mjs');
const { business } = await import('../business.mjs');
let passed = 0;
async function test(name, run) { await run(); passed++; console.log('PASS · ' + name); }
const record = (id, extra = {}) => ({ id, kind: 'Entrenamiento', date: '2026-11-21', kg: 40, reps: [10], ...extra });
const save = (uid, id, rev, entry = record(id)) => journal(uid, { updates: [{ id, rev, record: entry }] });
const bad = run => assert.rejects(run, error => error.status === 422);

try {
  await test('el lote no guarda parcialmente cuando una entrada posterior es inválida', async () => {
    await bad(() => journal('a', { updates: [
      { id: 'valid_first', rev: 0, record: record('valid_first') },
      { id: 'invalid_second', rev: 0, record: record('invalid_second', { date: '2026-02-30' }) }
    ] }));
    assert.equal((await journal('a')).records.length, 0);
  });
  await test('rollback real ante fallo SQL de la segunda escritura', async () => {
    await rows("CREATE TRIGGER audit_failure BEFORE INSERT ON diary_sync WHEN NEW.id='forced_fail' BEGIN SELECT RAISE(ABORT, 'test failure'); END");
    await assert.rejects(() => journal('a', { updates: [
      { id: 'atomic_first', rev: 0, record: record('atomic_first') },
      { id: 'forced_fail', rev: 0, record: record('forced_fail') }
    ] }));
    assert.equal((await journal('a')).records.length, 0);
    await rows('DROP TRIGGER audit_failure');
  });
  await test('fechas inexistentes, tipos, números y sueño inválidos se rechazan', async () => {
    for (const extra of [
      { date: '2025-02-29' }, { date: '2026-13-01' }, { date: '2026-04-31' },
      { kind: 'arbitrary' }, { value: -1 }, { kg: 'NaN' }, { protein: {} },
      { reps: [0] }, { reps: [-1] }, { reps: [1.5] }, { rir: 11 }, { rpe: -1 },
      { kind: 'Sueño', value: 25 }, { kind: 'Sueño', minutes: 1441 },
      { kind: 'Sueño', start: 2000, end: 1000 },
      { kind: 'Sueño', start: 1000, end: 3601000, value: 2 },
      { kind: 'Pasos', value: 10.5 }, { source: 'health' },
      { note: 'data:image/png;base64,AAAA' }
    ]) await bad(() => save('a', 'invalid_data', 0, record('invalid_data', extra)));
    assert.equal((await journal('a')).records.length, 0);
  });
  await test('compatibilidad con campos numéricos de formulario y día bisiesto válido', async () => {
    const result = await save('a', 'legacy_record', 0, record('legacy_record', { date: '2024-02-29', kg: '42.5', value: null, rir: '', protein: '12' }));
    assert.equal(result.accepted[0].rev, 1);
    assert.equal(result.records[0].record.kg, '42.5');
  });
  await test('diario idempotente, conflictos, borrado y aislamiento por usuario', async () => {
    await save('a', 'shared_record', 0);
    assert.equal((await save('a', 'shared_record', 0)).accepted[0].rev, 1);
    await save('b', 'shared_record', 0, record('shared_record', { kg: 99 }));
    assert.equal((await save('a', 'shared_record', 1, record('shared_record', { kg: 45 }))).accepted[0].rev, 2);
    assert.equal((await save('a', 'shared_record', 1, record('shared_record', { kg: 50 }))).conflicts[0].record.kg, 45);
    const deleted = await save('a', 'shared_record', 2, null);
    assert.equal(deleted.records.find(r => r.id === 'shared_record').record, null);
    assert.equal((await journal('b')).records[0].record.kg, 99);
  });
  await test('actualizaciones concurrentes no sobrescriben una revisión ya usada', async () => {
    await save('race', 'same_record', 0);
    const settled = await Promise.allSettled([save('race', 'same_record', 1, record('same_record', { kg: 41 })), save('race', 'same_record', 1, record('same_record', { kg: 42 }))]);
    for (const result of settled) if (result.status === 'rejected') throw result.reason;
    const results = settled.map(result => result.value);
    assert.equal(results.reduce((n, r) => n + r.accepted.length, 0), 1);
    assert.equal(results.reduce((n, r) => n + r.conflicts.length, 0), 1);
  });
  await test('paginación completa sin entradas de otra cuenta', async () => {
    for (let offset = 0; offset < 55; offset += 40) await journal('page', { updates: Array.from({ length: Math.min(40, 55 - offset) }, (_, i) => {
      const id = 'entry_' + String(i + offset).padStart(3, '0');
      return { id, rev: 0, record: record(id) };
    }) });
    const first = await journal('page');
    assert.equal(first.records.length, 50);
    assert.equal(first.next, 'entry_049');
    const second = await journal('page', { cursor: first.next });
    assert.equal(second.records.length, 5);
    assert.equal(second.next, null);
  });
  await test('lotes malformados, ids duplicados y borrados implícitos se rechazan', async () => {
    for (const input of [null, [], { updates: [null] }, { updates: [{ id: 'missing_record', rev: 0 }] },
      { updates: [{ id: 'dupe', rev: 0, record: record('dupe') }, { id: 'dupe', rev: 0, record: record('dupe') }] },
      { cursor: "' OR 1=1" }]) await bad(() => journal('a', input));
  });
  let registered;
  await test('registro, nick único normalizado y sesión con Bearer explícito', async () => {
    const d = { email: 'Audit@example.invalid', password: 'test-only-long-password', adult: true, notice: 'beta-3' };
    registered = await account('/register', d, 'registration');
    assert.equal(await authorize('Bearer ' + registered.token), registered.id);
    assert.equal(await authorize('bearer ' + registered.token), registered.id);
    assert.equal(await authorize(registered.token), null);
    assert.equal(await authorize('Basic ' + registered.token), null);
    assert.equal((await nickname(registered.id, ' @AuditUser ')).nick, 'AuditUser');
    await assert.rejects(() => nickname('different', 'audituser'), e => e.status === 409);
    await assert.rejects(() => account('/register', d, 'duplicate'), e => e.status === 409);
    await assert.rejects(() => account('/login', { ...d, password: 'wrong-long-password' }, 'wrong'), e => e.status === 401);
    const login = await account('/login', d, 'login');
    assert.equal(login.id, registered.id);
    await logout('Bearer ' + login.token);
    assert.equal(await authorize('Bearer ' + login.token), undefined);
  });
  await test('sesiones caducadas y registro sin aviso no autorizan acceso', async () => {
    await rows('UPDATE sessions SET expires=0 WHERE uid=?', registered.id);
    assert.equal(await authorize('Bearer ' + registered.token), undefined);
    await assert.rejects(() => account('/register', { email: 'blocked@example.invalid', password: 'long-enough-password' }, 'notice'), e => e.status === 422);
  });
  await test('rate limit devuelve 429 y no permite otro intento', async () => {
    for (let i = 0; i < 40; i++) await assert.rejects(() => account('/login', {}, 'rate-limit'), e => e.status === 422);
    await assert.rejects(() => account('/login', {}, 'rate-limit'), e => e.status === 429);
  });
  await test('cuota concurrente, devolución y configuración inválida', async () => {
    process.env.VERA_DAILY_LIMIT = '2';
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => consume('quota')));
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 2);
    assert.equal(results.filter(r => r.reason?.status === 429).length, 6);
    await releaseQuota(results.find(r => r.status === 'fulfilled').value);
    await consume('quota');
    process.env.VERA_DAILY_LIMIT = '0';
    await assert.rejects(() => consume('zero'), e => e.status === 429);
    for (const limit of ['1.5', '-1', 'NaN', 'Infinity']) {
      process.env.VERA_DAILY_LIMIT = limit;
      await assert.rejects(() => consume('invalid'), e => e.status === 503);
    }
  });
  await test('salas privadas y repetición idempotente tras cerrar', async () => {
    await nickname('friend', 'FriendAudit');
    const invoke = (action, uid, d = {}) => partnerAction('/partners/' + action, uid, d);
    const { room } = await invoke('invite', registered.id, { nick: '@FriendAudit', title: 'Audit', mode: 'together', plan: ['Remo'], target: 1 });
    await assert.rejects(() => invoke('room', 'stranger', { id: room.id }), e => e.status === 404);
    await invoke('respond', 'friend', { id: room.id, accept: true });
    const entry = { id: room.id, event: 'unique-event', exercise: 0 };
    await Promise.all([invoke('set', registered.id, entry), invoke('set', registered.id, entry)]);
    await invoke('finish', registered.id, { id: room.id });
    await invoke('set', registered.id, entry);
    await assert.rejects(() => invoke('set', registered.id, { ...entry, event: 'another-event' }), e => e.status === 409);
    assert.equal((await invoke('room', 'friend', { id: room.id })).room.counts[0].n, 1);
  });
  await test('negocio exige rol y valida fuentes sin guardar credenciales en URLs', async () => {
    await assert.rejects(() => business('/admin/summary', {}), e => e.status === 403);
    await assert.rejects(() => business('/admin/deal', {}, 'editor'), e => e.status === 403);
    await assert.rejects(() => business('/admin/catalog', { source: 'https://user:secret@example.invalid', brand: 'Test', model: 'Test', rights: 'Material propio' }, 'editor'), e => e.status === 422);
    await assert.rejects(() => business('/admin/catalog', { source: 'https://example.invalid', brand: {}, model: 'Test', rights: 'Material propio' }, 'editor'), e => e.status === 422);
    assert.equal((await rows('SELECT * FROM catalog_items')).length, 0);
  });
  await test('panel describe el proveedor activo y Groq no invoca búsqueda OpenAI', async () => {
    process.env.AI_PROVIDER = 'groq';
    process.env.GROQ_API_KEY = '';
    process.env.OPENAI_API_KEY = 'test-not-a-real-key';
    const summary = await business('/admin/summary', {}, 'analista');
    assert.deepEqual(summary.operations.aiProviders, ['groq','gemini']);
    assert.equal(summary.operations.aiRoutes.coach.configured, false);
    assert.equal(summary.operations.aiExecution, 'cloud-only');
    assert.equal(summary.operations.localInference, false);
    assert.equal('openAIConfigured' in summary.operations, false);
    assert.deepEqual(summary.deals, []);
    await assert.rejects(() => business('/admin/prospects', {}, 'propietario'), e => e.status === 501);
  });
  console.log(`BACKEND AUDIT: ${passed} pruebas superadas; SQLite local temporal, sin servicios externos.`);
} finally {
  db.close();
  await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
