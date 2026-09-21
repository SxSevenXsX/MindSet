const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const yaml = require('js-yaml');

function verifyRelease(directory, version, { requireSignature = true } = {}) {
  const installer = `MindSet-Setup-${version}.exe`;
  const manifest = yaml.load(fs.readFileSync(path.join(directory, 'latest.yml'), 'utf8'));
  const digest = crypto.createHash('sha512').update(fs.readFileSync(path.join(directory, installer))).digest();
  const entry = manifest.files?.find(file => file.url === installer);
  if (manifest.version !== version || manifest.path !== installer || manifest.sha512 !== digest.toString('base64')
    || entry?.sha512 !== digest.toString('base64') || entry.size !== fs.statSync(path.join(directory, installer)).size) {
    throw Error('Le manifeste ne correspond pas à l’installeur. Publication arrêtée.');
  }
  if (!fs.statSync(path.join(directory, `${installer}.blockmap`)).size) throw Error('Blockmap absent ou vide.');
  const report = JSON.parse(fs.readFileSync(path.join(directory, 'signature-verification.json'), 'utf8'));
  const app = report.files?.find(file => file.file === 'win-unpacked/MindSet.exe');
  const setup = report.files?.find(file => file.file === installer);
  const signed = app?.publisher && app?.thumbprint && app.publisher === setup?.publisher && app.thumbprint === setup.thumbprint
    && [app, setup].every(file => file.status === 'Valid' && file.timestamped === true);
  const unsigned = !requireSignature && report.mode === 'unsigned' && app && setup
    && [app, setup].every(file => file.status === 'NotSigned' && !file.publisher && !file.thumbprint);
  if (report.version !== version || !(signed || unsigned) || setup?.sha512?.toLowerCase() !== digest.toString('hex')) {
    throw Error('La vérification des signatures Windows a échoué. Publication arrêtée.');
  }
  return [installer, `${installer}.blockmap`, 'latest.yml'];
}

if (require.main === module) {
  verifyRelease(path.resolve('dist'), require('../package.json').version, { requireSignature: !process.argv.includes('--unsigned') });
  console.log('Installeur et manifeste vérifiés.');
}
module.exports = { verifyRelease };
