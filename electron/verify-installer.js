const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { createReadStream } = require("node:fs");
const { createHash } = require("node:crypto");
const path = require("node:path");
const execute = promisify(execFile);

async function windowsSignature(file) {
  if (process.platform !== "win32") throw new Error("La vérification des signatures nécessite Windows.");
  const command = "$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[Text.Encoding]::UTF8; $s=Get-AuthenticodeSignature -LiteralPath $env:MINDSET_INSTALLER_TO_VERIFY; $publisher=''; $thumbprint=''; if ($s.SignerCertificate) { $publisher=$s.SignerCertificate.GetNameInfo([System.Security.Cryptography.X509Certificates.X509NameType]::SimpleName,$false); $thumbprint=$s.SignerCertificate.Thumbprint }; @{status=$s.Status.ToString();publisher=$publisher;thumbprint=$thumbprint;timestamped=($null -ne $s.TimeStamperCertificate)} | ConvertTo-Json -Compress";
  const powershell = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  let result;
  try {
    result = await execute(powershell, ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(command, "utf16le").toString("base64")], {
      // Use Windows PowerShell modules even when the parent shell is PowerShell 7.
      env: { ...process.env, PSModulePath: path.join(path.dirname(powershell), "Modules"), MINDSET_INSTALLER_TO_VERIFY: path.resolve(file) },
      windowsHide: true, timeout: 30000, maxBuffer: 65536,
    });
    return JSON.parse(result.stdout.replace(/^\uFEFF/, "").trim());
  } catch (cause) {
    const error = new Error("Windows n’a pas pu vérifier la signature de la mise à jour. L’installation est arrêtée.", { cause });
    error.code = "ERR_UPDATE_SIGNATURE_CHECK_FAILED";
    throw error;
  }
}

async function verifyInstaller(file, info, { requireSignature = false, signatureReader = windowsSignature } = {}) {
  const expected = info.files?.find(entry => /\.exe(?:$|\?)/i.test(entry.url))?.sha512 || info.sha512;
  if (!expected) throw new Error("L’empreinte de l’installeur est absente. Relance la recherche de mise à jour.");
  const hash = createHash("sha512");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  if (hash.digest("base64") !== expected) throw new Error("Le fichier téléchargé a changé. Relance le téléchargement.");
  const signature = await signatureReader(file);
  // Personal builds can remain unsigned. A present but invalid signature is never accepted.
  // electron-updater additionally checks publisher identity when the installed build defines one.
  if (signature.status === "NotSigned" && !requireSignature) return;
  if (signature.status !== "Valid") {
    const error = new Error("La signature Windows de l’installeur n’est pas valide.");
    error.code = signature.status === "NotSigned" ? "ERR_UPDATE_UNSIGNED" : "ERR_UPDATE_SIGNATURE_INVALID";
    throw error;
  }
}

module.exports = { verifyInstaller, windowsSignature };
