const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { windowsSignature } = require('../electron/verify-installer');

async function verifyWindowsSignatures(directory, version, publisher) {
  if (!publisher?.trim()) throw Error('SIGNING_PUBLISHER_NAME est requis.');
  const files = [];
  for (const file of ['win-unpacked/MindSet.exe', `MindSet-Setup-${version}.exe`]) {
    const filename = path.join(directory, file);
    const signature = await windowsSignature(filename);
    if (signature.status !== 'Valid' || signature.publisher !== publisher.trim() || !signature.timestamped) {
      throw Error(`Signature, titulaire ou horodatage incorrect : ${file}.`);
    }
    files.push({ file, ...signature, sha512: createHash('sha512').update(await fs.readFile(filename)).digest('hex') });
  }
  if (files[0].thumbprint !== files[1].thumbprint) throw Error('Certificats différents entre application et installeur.');
  await fs.writeFile(path.join(directory, 'signature-verification.json'), JSON.stringify({ version, files }, null, 2));
}

if (require.main === module) {
  verifyWindowsSignatures(path.resolve('dist'), require('../package.json').version, process.env.SIGNING_PUBLISHER_NAME)
    .then(() => console.log('Signatures Windows et horodatages vérifiés.'))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { verifyWindowsSignatures };
