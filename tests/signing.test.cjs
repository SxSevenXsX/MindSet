const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const yaml = require('js-yaml');
const { signingConfig } = require('../scripts/signing-config.cjs');
const { verifyRelease } = require('../scripts/verify-release.cjs');
const { verifyInstaller } = require('../electron/verify-installer');
const { attemptStore } = require('../electron/update-manager');

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mindset-signing-test-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(dir).startsWith('mindset-signing-test-'));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const version = '1.3.3';
  const file = `MindSet-Setup-${version}.exe`;
  fs.writeFileSync(path.join(dir, file), 'test artifact, never executed');
  const digest = createHash('sha512').update(fs.readFileSync(path.join(dir, file))).digest();
  const manifest = { version, files: [{ url: file, sha512: digest.toString('base64'), size: fs.statSync(path.join(dir, file)).size }], path: file, sha512: digest.toString('base64') };
  fs.writeFileSync(path.join(dir, 'latest.yml'), yaml.dump(manifest));
  fs.writeFileSync(path.join(dir, `${file}.blockmap`), 'test blockmap');
  const signature = { status: 'Valid', timestamped: true, publisher: 'Test Publisher', thumbprint: 'A'.repeat(40), sha512: digest.toString('hex') };
  const report = { version, files: [{ file: 'win-unpacked/MindSet.exe', ...signature }, { file, ...signature }] };
  fs.writeFileSync(path.join(dir, 'signature-verification.json'), JSON.stringify(report));
  return { dir, version, file, manifest, report };
}

test('a signed build requires an explicit publisher and usable certificate configuration', () => {
  assert.throws(() => signingConfig({}), /SIGNING_PUBLISHER_NAME/);
  assert.throws(() => signingConfig({ SIGNING_PUBLISHER_NAME: 'Test' }), /Aucun certificat/);
  assert.throws(() => signingConfig({ SIGNING_PUBLISHER_NAME: 'Test', SIGNING_CERTIFICATE_SHA1: 'bad' }), /empreinte/);
  const config = signingConfig({ SIGNING_PUBLISHER_NAME: 'Test', SIGNING_CERTIFICATE_SHA1: 'a'.repeat(40) });
  assert.equal(config.forceCodeSigning, true);
  assert.equal(config.win.verifyUpdateCodeSignature, true);
  assert.equal(config.win.signtoolOptions.certificateSha1, 'A'.repeat(40));
  const fileConfig = signingConfig({ SIGNING_PUBLISHER_NAME: 'Test', CSC_LINK: 'test.pfx' });
  assert.equal(fileConfig.forceCodeSigning, true);
});

test('release accepts only matching post-signing metadata', t => {
  const f = fixture(t);
  assert.deepEqual(verifyRelease(f.dir, f.version), [f.file, `${f.file}.blockmap`, 'latest.yml']);
  assert.throws(() => verifyRelease(f.dir, '1.3.4'));
  fs.appendFileSync(path.join(f.dir, f.file), 'tampered');
  assert.throws(() => verifyRelease(f.dir, f.version), /manifeste/);
});

test('release refuses absent, failed, untimestamped or mismatched signature verification', t => {
  const f = fixture(t);
  for (const change of [
    report => { report.files[1].status = 'NotSigned'; },
    report => { report.files[0].timestamped = false; },
    report => { report.files[1].publisher = 'Other Publisher'; },
    report => { report.files[1].sha512 = 'old installer'; },
  ]) {
    const report = structuredClone(f.report);
    change(report);
    fs.writeFileSync(path.join(f.dir, 'signature-verification.json'), JSON.stringify(report));
    assert.throws(() => verifyRelease(f.dir, f.version), /signatures/);
  }
  fs.unlinkSync(path.join(f.dir, 'signature-verification.json'));
  assert.throws(() => verifyRelease(f.dir, f.version));
});

test('runtime rejects a changed download before attempting signature verification', async t => {
  const f = fixture(t);
  fs.appendFileSync(path.join(f.dir, f.file), 'changed');
  await assert.rejects(verifyInstaller(path.join(f.dir, f.file), f.manifest), /a changé/);
});

test('Windows refuses a malformed executable without running it', { skip: process.platform !== 'win32' }, async t => {
  const f = fixture(t);
  await assert.rejects(verifyInstaller(path.join(f.dir, f.file), f.manifest), { code: 'ERR_UPDATE_SIGNATURE_INVALID' });
});

test('installation receipt survives process restart and can be replaced and cleared', async t => {
  const f = fixture(t);
  const store = attemptStore(f.dir);
  assert.equal(await store.read(), null);
  await store.write({ fromVersion: '1.2.3', version: '1.3.3' });
  assert.deepEqual(await attemptStore(f.dir).read(), { fromVersion: '1.2.3', version: '1.3.3' });
  await store.write({ fromVersion: '1.3.3', version: '1.3.4' });
  assert.equal((await store.read()).version, '1.3.4');
  await store.clear();
  assert.equal(await store.read(), null);
});


test('free releases require explicit unsigned mode and matching inspected artifacts', t => {
  const f=fixture(t); f.report.mode='unsigned';
  for(const file of f.report.files) Object.assign(file,{status:'NotSigned',publisher:'',thumbprint:'',timestamped:false});
  fs.writeFileSync(path.join(f.dir,'signature-verification.json'),JSON.stringify(f.report));
  assert.throws(()=>verifyRelease(f.dir,f.version),/signatures/);
  assert.equal(verifyRelease(f.dir,f.version,{requireSignature:false}).length,3);
  f.report.files[1].status='HashMismatch';fs.writeFileSync(path.join(f.dir,'signature-verification.json'),JSON.stringify(f.report));
  assert.throws(()=>verifyRelease(f.dir,f.version,{requireSignature:false}),/signatures/);
});
test('an invalid present signature is rejected even for a personal build',async t=>{
  const f=fixture(t);
  for(const status of ['HashMismatch','NotTrusted','UnknownError']) await assert.rejects(verifyInstaller(path.join(f.dir,f.file),f.manifest,{signatureReader:async()=>({status})}),{code:'ERR_UPDATE_SIGNATURE_INVALID'});
});

test('an absent signature is allowed only for the personal build policy',async t=>{
 const f=fixture(t),signatureReader=async()=>({status:'NotSigned'});
 await verifyInstaller(path.join(f.dir,f.file),f.manifest,{signatureReader});
 await assert.rejects(verifyInstaller(path.join(f.dir,f.file),f.manifest,{signatureReader,requireSignature:true}),{code:'ERR_UPDATE_UNSIGNED'});
});
