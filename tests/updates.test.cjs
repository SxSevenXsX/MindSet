const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { UpdateManager } = require('../electron/update-manager');
const { CloseCoordinator } = require('../electron/close-coordinator');

function fixture(overrides = {}) {
  const updater = new EventEmitter();
  const calls = [];
  let attempt = overrides.attempt || null;
  updater.installerPath = 'verified-installer.exe';
  updater.checkForUpdates = async () => {
    calls.push('check');
    updater.emit('checking-for-update');
    return { isUpdateAvailable: true, updateInfo: { version: '1.3.3' } };
  };
  updater.downloadUpdate = async () => {
    calls.push('download');
    updater.emit('update-downloaded', { version: '1.3.3' });
    return ['verified-installer.exe'];
  };
  updater.quitAndInstall = (...args) => calls.push(['install', ...args]);
  const manager = new UpdateManager({
    updater, installedVersion: '1.2.3', isPackaged: true,
    store: {
      read: async () => attempt,
      write: async value => { calls.push('record'); attempt = value; },
      clear: async () => { attempt = null; },
    },
    verifyInstaller: async () => calls.push('verify'),
    prepareInstall: async () => calls.push('save'),
    cancelInstall: () => calls.push('cancel'),
    publish: () => {},
    ...overrides,
  });
  return { updater, manager, calls, attempt: () => attempt };
}

async function ready(f) { await f.manager.check(); await f.manager.download(); }

test('check/download/restart verifies and saves before launching the installer once', async () => {
  const f = fixture();
  await ready(f);
  const a = f.manager.install();
  const b = f.manager.install();
  assert.equal(a, b);
  await a;
  assert.deepEqual(f.calls, ['check', 'download', 'verify', 'save', 'record', ['install', false, true]]);
  assert.deepEqual(f.attempt(), { fromVersion: '1.2.3', version: '1.3.3' });
  assert.equal(f.updater.autoInstallOnAppQuit, false);
});

test('same installed version is never offered again, including a stale available event', async () => {
  const f = fixture();
  f.updater.checkForUpdates = async () => ({ isUpdateAvailable: true, updateInfo: { version: '1.2.3' } });
  f.updater.emit('update-available', { version: '1.2.3' });
  assert.equal(f.manager.getState().status, 'idle');
  assert.equal((await f.manager.check()).status, 'not-available');
});

test('respects updater decision for an older release instead of comparing unequal strings', async () => {
  const f = fixture();
  f.updater.checkForUpdates = async () => ({ isUpdateAvailable: false, updateInfo: { version: '1.1.0' } });
  assert.equal((await f.manager.check()).status, 'not-available');
});

test('repeated checking preserves an already downloaded installer', async () => {
  const f = fixture();
  await ready(f);
  assert.equal((await f.manager.check()).status, 'downloaded');
  await f.manager.download();
  assert.deepEqual(f.calls, ['check', 'download']);
});

test('does not close or run an installer rejected by verification', async () => {
  const error = Object.assign(new Error('unsigned'), { code: 'ERR_UPDATE_UNSIGNED' });
  const f = fixture({ verifyInstaller: async () => { throw error; } });
  await ready(f);
  assert.match((await f.manager.install()).message, /signature/);
  assert.ok(!f.calls.includes('save'));
  assert.ok(!f.calls.includes('record'));
  assert.ok(!f.calls.some(Array.isArray));
});

test('a save failure cancels installation without closing the app', async () => {
  const f = fixture({ prepareInstall: async () => { throw Error('Sauvegarde impossible'); } });
  await ready(f);
  assert.equal((await f.manager.install()).status, 'error');
  assert.ok(!f.calls.includes('record'));
  assert.ok(!f.calls.some(Array.isArray));
});

test('waits for save acknowledgement rather than starting the installer during close', async () => {
  let resolveSave;
  const f = fixture({ prepareInstall: () => new Promise(resolve => { resolveSave = resolve; }) });
  await ready(f);
  const installing = f.manager.install();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(!f.calls.includes('record'));
  resolveSave();
  await installing;
  assert.ok(f.calls.includes('record'));
});

test('cannot install before a download has completed', async () => {
  const f = fixture();
  assert.equal((await f.manager.install()).status, 'error');
  assert.ok(!f.calls.some(Array.isArray));
});

test('reports success only when the next launch runs the requested version', async () => {
  const f = fixture({ installedVersion: '1.3.3', attempt: { fromVersion: '1.2.3', version: '1.3.3' } });
  assert.equal((await f.manager.initialize()).status, 'installed');
  assert.equal(f.attempt(), null);
});

test('reports an installation that left the old version, without starting it again', async () => {
  const f = fixture({ attempt: { fromVersion: '1.2.3', version: '1.3.3' } });
  assert.match((await f.manager.initialize()).message, /1\.2\.3.*toujours installée/);
  assert.equal(f.attempt(), null);
  assert.deepEqual(f.calls, []);
});

test('a download failure never enables installation', async () => {
  const f = fixture();
  f.updater.downloadUpdate = async () => { throw Error('Network failed'); };
  await f.manager.check();
  assert.equal((await f.manager.download()).status, 'error');
  assert.equal((await f.manager.install()).status, 'error');
  assert.ok(!f.calls.some(Array.isArray));
});

test('duplicate checks are coalesced', async () => {
  const f = fixture();
  const a = f.manager.check();
  assert.equal(a, f.manager.check());
  await a;
  assert.deepEqual(f.calls, ['check']);
});

test('close handshake rejects stale acknowledgements and unlocks only after saving', async () => {
  const messages = [];
  const close = new CloseCoordinator({ send: (...args) => messages.push(args) });
  const saving = close.request('update');
  assert.equal(close.allowed, false);
  assert.equal(close.acknowledge('old', true), false);
  assert.equal(close.allowed, false);
  close.acknowledge(messages[0][1].requestId, true);
  await saving;
  assert.equal(close.allowed, true);
  close.cancel('update-error');
  assert.equal(close.allowed, false);
  assert.equal(messages.at(-1)[0], 'mindset:close-cancelled');
});

test('save timeout keeps the app open and permits a later retry', async () => {
  const close = new CloseCoordinator({ send: () => {}, timeoutMs: 10 });
  await assert.rejects(close.request('update'), /trop de temps/);
  assert.equal(close.allowed, false);
  const retry = close.request('update');
  close.acknowledge(close.pending.requestId, true);
  await retry;
  assert.equal(close.allowed, true);
});

test('a renderer save error cannot allow closing', async () => {
  const close = new CloseCoordinator({ send: () => {} });
  const saving = close.request('update');
  close.acknowledge(close.pending.requestId, false);
  await assert.rejects(saving, /sauvegarde/);
  assert.equal(close.allowed, false);
});

test('a normal close and an update cannot run competing saves', async () => {
  const close = new CloseCoordinator({ send: () => {} });
  const saving = close.request('close');
  await assert.rejects(close.request('update'), /déjà en cours/);
  close.acknowledge(close.pending.requestId, true);
  await saving;
});

test('late updater errors during verification abort the pending installation', async () => {
  let completeVerification;
  const f = fixture({ verifyInstaller: () => new Promise(resolve => { completeVerification = resolve; }) });
  await ready(f);
  const installing = f.manager.install();
  await new Promise(resolve => setImmediate(resolve));
  f.updater.emit('error', Error('Installer became unavailable'));
  completeVerification();
  assert.equal((await installing).status, 'error');
  assert.ok(!f.calls.includes('save'));
  assert.ok(!f.calls.some(Array.isArray));
});

test('receipt write failure cancels the prepared close', async () => {
  const f = fixture({ store: { write: async () => { throw Error('Disk full'); } } });
  await ready(f);
  assert.equal((await f.manager.install()).status, 'error');
  assert.ok(f.calls.includes('save'));
  assert.ok(f.calls.includes('cancel'));
  assert.ok(!f.calls.some(Array.isArray));
});

test('actions after installer launch cannot cancel or launch it again', async () => {
  const f = fixture();
  await ready(f);
  await f.manager.install();
  await f.manager.check();
  await f.manager.install();
  assert.equal(f.manager.getState().status, 'installing');
  assert.equal(f.calls.filter(Array.isArray).length, 1);
  assert.ok(!f.calls.includes('cancel'));
});
