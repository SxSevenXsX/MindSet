const { test } = require('node:test');
const assert = require('node:assert/strict');
const archive = require('../src/box-archive');
const storage = require('../src/storage-guard');
const { create: guide } = require('../src/guide');
const { acquireSingleInstance } = require('../electron/single-instance');
const { EventEmitter } = require('node:events');
const copy = value => JSON.parse(JSON.stringify(value));
const box = { id: 'box-a', name: 'Cours été', passwordHash: '', root: { id: 'root-a', type: 'folder', title: 'Cours', children: [{ id: 'note-a', type: 'note', title: 'Ma note', content: '<h1>Titre</h1><p>été</p>' }, { id: 'audio-a', type: 'audio', title: 'Son', clips: [{ id: 'clip-a', name: 'Enregistrement' }] }] } };
const audio = archive.encodeAudio({ id: 'clip-a', boxId: 'box-a', mime: 'audio/wav', enc: false, data: Uint8Array.from([0, 127, 128, 255]).buffer });
const payload = () => ({ boxes: [copy(box)], audio: [copy(audio)] });

test('archive restores Unicode, rich content and exact binary audio', async () => {
  const result = await archive.parse(await archive.create(payload()));
  assert.deepEqual(result.payload, payload());
  assert.deepEqual([...new Uint8Array(archive.decodeAudio(result.payload.audio[0]).data)], [0, 127, 128, 255]);
});
test('damaged or modified backups are rejected before import', async () => {
  const original = await archive.create(payload());
  await assert.rejects(archive.parse(original.slice(0, -8)));
  const edited = JSON.parse(original); edited.payload.boxes[0].name = 'Changed';
  await assert.rejects(archive.parse(JSON.stringify(edited)), /modifié/);
});
test('duplicate boxes keep existing content and skip their audio', () => {
  const existing = [{ ...box, name: 'Travail plus récent' }];
  const plan = archive.planImport(payload(), existing, [{ id: 'clip-a' }]);
  assert.equal(plan.skipped, 1); assert.equal(plan.boxes.length, 0); assert.equal(plan.audio.length, 0);
  assert.equal(existing[0].name, 'Travail plus récent');
});
test('colliding audio never replaces an existing recording', () => {
  assert.throws(() => archive.planImport(payload(), [], [{ id: 'clip-a', boxId: 'another-box' }]), /audio existe déjà/);
});
test('missing audio, duplicate nodes and malformed references refuse the whole archive', () => {
  const missing = payload(); missing.audio = [];
  assert.throws(() => archive.validatePayload(missing), /manque/);
  const duplicate = payload(); duplicate.boxes[0].root.children.push(copy(box.root.children[0]));
  assert.throws(() => archive.validatePayload(duplicate), /Structure/);
  const injected = payload(); injected.boxes[0].id = '" onclick="';
  assert.throws(() => archive.validatePayload(injected), /Identité/);
});
test('protected archives preserve encrypted variants and reject any plaintext variant', async () => {
  const encryptedBox = { id: 'box-a', name: 'Secret', passwordHash: 'hash', encrypted: { v: 1, salt: Buffer.alloc(16, 7).toString('base64'), iv: Buffer.alloc(12, 8).toString('base64'), data: Buffer.alloc(32, 9).toString('base64') } };
  const record = { ...audio, enc: true, iv: Buffer.alloc(12, 1).toString('base64') };
  record.pending = { enc: true, iv: record.iv, data: record.data };
  const data = { boxes: [encryptedBox], audio: [record] };
  assert.deepEqual((await archive.parse(await archive.create(data))).payload, data);
  record.pending.enc = false;
  await assert.rejects(archive.create(data), /non chiffré/);
  const legacy = { ...box, passwordHash: 'legacy' };
  await assert.rejects(archive.create({ boxes: [legacy], audio: [audio] }), /chiffrée/);
});
test('prototype properties and unsupported archive versions are refused', async () => {
  assert.throws(() => archive.safeParse('{"__proto__":{}}'));
  const data = JSON.parse(await archive.create(payload())); data.version = 99;
  await assert.rejects(archive.parse(JSON.stringify(data)), /non reconnu/);
});
test('the encrypted payload can validate references without requiring decoded audio', () => {
  assert.doesNotThrow(() => archive.validateOpenedBox(box));
  const invalid = copy(box); invalid.root.children[0].type = 'iframe';
  assert.throws(() => archive.validateOpenedBox(invalid));
});
test('storage errors never create replacement seed data or erase unreadable bytes', () => {
  let seeded = 0;
  const seed = () => { seeded++; return { boxes: [] }; };
  for (const raw of ['', '{broken', '{"boxes":[{}]}', '{"boxes":[{"id":"b","name":"X","root":{}}]}']) {
    const result = storage.read({ getItem: () => raw }, 'key', x => x, seed);
    assert.equal(result.blocked, true); assert.equal(result.raw, raw);
  }
  assert.equal(storage.read({ getItem() { throw Error('locked'); } }, 'key', x => x, seed).blocked, true);
  assert.equal(seeded, 0);
});
test('an intentionally empty workspace remains empty and only first launch gets a guide', () => {
  const existing = storage.read({ getItem: () => '{"boxes":[]}' }, 'key', x => x, () => { throw Error('must not seed'); });
  assert.equal(existing.blocked, false); assert.deepEqual(existing.state.boxes, []);
  const initial = storage.read({ getItem: () => null }, 'key', x => x, () => ({ boxes: ['guide'] }));
  assert.deepEqual(initial.state.boxes, ['guide']);
});
test('a second process quits before creating a window', () => {
  const app = new EventEmitter(); let quit = 0;
  app.requestSingleInstanceLock = () => false; app.quit = () => quit++;
  assert.equal(acquireSingleInstance(app, () => { throw Error('no window'); }), false);
  assert.equal(quit, 1); assert.equal(app.listenerCount('second-instance'), 0);
});
test('a second launch restores and focuses the existing window, even during startup', () => {
  const app = new EventEmitter(); app.requestSingleInstanceLock = () => true;
  let window = null; const calls = [];
  assert.equal(acquireSingleInstance(app, () => window), true);
  app.emit('second-instance');
  window = new EventEmitter(); Object.assign(window, { isDestroyed: () => false, isMinimized: () => true, restore: () => calls.push('restore'), show: () => calls.push('show'), focus: () => calls.push('focus') });
  app.emit('browser-window-created', {}, window); window.emit('ready-to-show');
  assert.deepEqual(calls, ['restore', 'show', 'focus']);
  app.emit('second-instance'); assert.equal(calls.length, 6);
});
test('the initial guide is a valid, independently editable box with unique node IDs', () => {
  let counter = 0;
  const value = guide(prefix => `${prefix}-${++counter}`, () => '2026-09-19T00:00:00.000Z');
  assert.equal(value.isGuide, true); assert.ok(value.root.children.length >= 5);
  assert.doesNotThrow(() => archive.validatePayload({ boxes: [value], audio: [] }));
  assert.match(JSON.stringify(value), /256 Mo/);
});

test('vendored DOMPurify matches the pinned dependency byte for byte', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.resolve(__dirname, '..');
  assert.deepEqual(fs.readFileSync(path.join(root, 'src/vendor/purify.min.js')), fs.readFileSync(path.join(root, 'node_modules/dompurify/dist/purify.min.js')));
});
