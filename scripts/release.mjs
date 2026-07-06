import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = pkg.version;
const tag = `v${version}`;
const owner = "SxSevenXsX";
const repo = "MindSet";

function fail(message) {
  console.error(`\n[release] ${message}`);
  process.exit(1);
}

function gitCredentialToken() {
  try {
    const output = execFileSync("git", ["credential", "fill"], {
      input: "protocol=https\nhost=github.com\n\n",
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    return output.split("\n").find((line) => line.startsWith("password="))?.slice("password=".length) || "";
  } catch {
    return "";
  }
}

async function github(token, method, path, body = null) {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      authorization: `token ${token}`,
      accept: "application/vnd.github+json",
      "user-agent": "mindset-release-script",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, data: await response.json().catch(() => null) };
}

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || gitCredentialToken();
if (!token) fail("Aucun token GitHub trouve (GH_TOKEN, GITHUB_TOKEN ou git credential).");

console.log(`[release] Version ${version} (tag ${tag})`);

// 1. Le tag doit exister sur origin (sinon GitHub refuse une release publiee).
const remoteTag = spawnSync("git", ["ls-remote", "origin", `refs/tags/${tag}`], { encoding: "utf8" });
if (!remoteTag.stdout.trim()) {
  fail(`Le tag ${tag} n'existe pas sur GitHub. Lance d'abord :\n  git tag ${tag}\n  git push origin main --tags`);
}

// 2. Pre-cree la release publiee si elle n'existe pas (evite la course entre publishers).
const existing = await github(token, "GET", `/repos/${owner}/${repo}/releases/tags/${tag}`);
if (existing.status === 404) {
  const created = await github(token, "POST", `/repos/${owner}/${repo}/releases`, {
    tag_name: tag,
    name: version,
    draft: false,
    prerelease: false,
  });
  if (created.status !== 201) fail(`Creation de la release impossible (HTTP ${created.status}): ${JSON.stringify(created.data)}`);
  console.log(`[release] Release GitHub ${tag} creee.`);
} else if (existing.status === 200) {
  console.log(`[release] Release GitHub ${tag} deja presente, les fichiers seront mis a jour.`);
} else {
  fail(`Verification de la release impossible (HTTP ${existing.status}).`);
}

// 3. Construit et publie avec electron-builder.
const build = spawnSync("npx", ["electron-builder", "--win", "nsis", "--publish", "always"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, GH_TOKEN: token },
});
if (build.status !== 0) fail("electron-builder a echoue.");

// 4. Copie les artefacts dans release-<version>/ (meme organisation que les versions precedentes).
const releaseDir = join(root, `release-${version}`);
mkdirSync(releaseDir, { recursive: true });
for (const file of [`MindSet-Setup-${version}.exe`, `MindSet-Setup-${version}.exe.blockmap`, "latest.yml"]) {
  copyFileSync(join(root, "dist", file), join(releaseDir, file));
}
console.log(`[release] Artefacts copies dans release-${version}/`);
console.log(`[release] Termine : https://github.com/${owner}/${repo}/releases/tag/${tag}`);
