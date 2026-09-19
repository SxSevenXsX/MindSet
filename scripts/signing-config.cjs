const { build } = require('../package.json');

function signingConfig(env = process.env) {
  const publisherName = env.SIGNING_PUBLISHER_NAME?.trim();
  const certificateSha1 = env.SIGNING_CERTIFICATE_SHA1?.replace(/\s/g, '').toUpperCase();
  if (!publisherName) throw Error('SIGNING_PUBLISHER_NAME est requis : nom exact du titulaire du certificat. Voir docs/windows-signing.md.');
  if (!certificateSha1 && !env.CSC_LINK) {
    throw Error('Aucun certificat de signature configuré. Définir SIGNING_CERTIFICATE_SHA1 (magasin Windows) ou CSC_LINK. Aucune version non signée ne sera publiée.');
  }
  if (certificateSha1 && !/^[A-F0-9]{40}$/.test(certificateSha1)) throw Error('SIGNING_CERTIFICATE_SHA1 doit être une empreinte de certificat de 40 caractères hexadécimaux.');
  return {
    ...build,
    extends: null,
    forceCodeSigning: true,
    win: {
      ...build.win,
      signExecutable: true,
      verifyUpdateCodeSignature: true,
      signtoolOptions: {
        publisherName,
        signingHashAlgorithms: ['sha256'],
        ...(certificateSha1 ? { certificateSha1 } : {}),
      },
    },
  };
}

module.exports = { signingConfig };
