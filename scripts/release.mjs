import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { signingConfig } = require('./signing-config.cjs');
const { verifyWindowsSignatures } = require('./verify-windows-signatures.cjs');
const { verifyRelease } = require('./verify-release.cjs');
const root = resolve(process.cwd());
const { version } = require('../package.json');
const tag = `v${version}`;
const repository = 'SxSevenXsX/MindSet';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options });
  if (result.error || result.status !== 0) throw Error(`Échec : ${command} ${args.join(' ')}`);
  return result.stdout?.trim();
}

function gitCredentialToken() {
  try {
    const output = execFileSync('git', ['credential', 'fill'], {
      input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'],
    });
    return output.split(/\r?\n/).find(line => line.startsWith('password='))?.slice(9) || '';
  } catch { return ''; }
}

async function publish() {
  if (process.platform !== 'win32') throw Error('La publication locale signée nécessite Windows.');
  signingConfig(); // Fail before building or changing anything on GitHub when the certificate is absent.
  run('git', ['diff', '--quiet', 'HEAD', '--']);
  const untracked = run('git', ['ls-files', '--others', '--exclude-standard', '--', 'electron', 'src', 'assets', 'scripts', 'tests', '.github', 'electron-builder.release.cjs']);
  if (untracked) throw Error('Valider les nouveaux fichiers du projet avant publication.');
  const head = run('git', ['rev-parse', 'HEAD']);
  const remoteTag = run('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`, `refs/tags/${tag}^{}`]);
  const tagLines = remoteTag.split(/\r?\n/).filter(Boolean);
  const remoteCommit = tagLines.find(line => line.endsWith('^{}')) || tagLines[0];
  if (remoteCommit?.split(/\s/)[0] !== head) throw Error(`Le tag distant ${tag} doit correspondre au commit courant.`);

  const tests = readdirSync(join(root, 'tests')).filter(name => name.endsWith('.test.cjs')).map(name => join('tests', name));
  run(process.execPath, ['--test', ...tests], { stdio: 'inherit' });
  run(process.execPath, [require.resolve('electron-builder/cli.js'), '--config', 'electron-builder.release.cjs', '--win', 'nsis', '--publish', 'never'], { stdio: 'inherit' });
  await verifyWindowsSignatures(join(root, 'dist'), version, process.env.SIGNING_PUBLISHER_NAME);
  const files = verifyRelease(join(root, 'dist'), version);
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || gitCredentialToken();
  if (!token) throw Error('Identifiants GitHub absents. Les fichiers signés restent dans dist/.');
  const headers = { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': 'mindset-release-script' };
  async function api(method, route, body) {
    const response = await fetch(`https://api.github.com/repos/${repository}${route}`, {
      method, headers: { ...headers, 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(60000),
    });
    if (method === 'GET' && response.status === 404) return null;
    if (!response.ok) throw Error(`GitHub : HTTP ${response.status} (${method} ${route}).`);
    return response.status === 204 ? null : response.json();
  }
  let release = await api('GET', `/releases/tags/${tag}`);
  if (release && !release.draft) throw Error(`${tag} est déjà publié ; utiliser une nouvelle version.`);
  const notes = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
  release ||= await api('POST', '/releases', { tag_name: tag, name: version, draft: true, prerelease: false, body: notes });
  const digests = new Map();
  for (const file of files) {
    for (const asset of release.assets || []) {
      if (asset.name === file) await api('DELETE', `/releases/assets/${asset.id}`);
    }
    const body = readFileSync(join(root, 'dist', file));
    digests.set(file, `sha256:${createHash('sha256').update(body).digest('hex')}`);
    const uploaded = await fetch(`https://uploads.github.com/repos/${repository}/releases/${release.id}/assets?name=${encodeURIComponent(file)}`, {
      method: 'POST', headers: { ...headers, 'content-type': 'application/octet-stream' }, body, signal: AbortSignal.timeout(180000),
    });
    if (!uploaded.ok) throw Error(`Envoi interrompu (HTTP ${uploaded.status}) : ${file}. La version reste en brouillon.`);
  }
  const assets = await api('GET', `/releases/${release.id}/assets`);
  for (const file of files) {
    const matches = assets.filter(asset => asset.name === file);
    if (matches.length !== 1 || matches[0].size !== statSync(join(root, 'dist', file)).size
      || (matches[0].digest && matches[0].digest !== digests.get(file))) throw Error(`Fichier distant incorrect : ${file}. La version reste en brouillon.`);
  }
  const releaseDir = join(root, `release-${version}`);
  mkdirSync(releaseDir, { recursive: true });
  for (const file of files) copyFileSync(join(root, 'dist', file), join(releaseDir, file));
  await api('PATCH', `/releases/${release.id}`, { draft: false, make_latest: 'true', body: notes });
  console.log(`Version signée publiée : https://github.com/${repository}/releases/tag/${tag}`);
}

publish().catch(error => { console.error(`[release] ${error.message}`); process.exitCode = 1; });
