const fs = require("node:fs/promises");
const path = require("node:path");

function updateMessage(error) {
  if (error?.code === "ERR_UPDATER_INVALID_SIGNATURE" || error?.code === "ERR_UPDATE_UNSIGNED") {
    return "Windows ne peut pas vérifier la signature de cette mise à jour. L’installation est arrêtée ; une version signée est nécessaire.";
  }
  if (["EACCES", "EPERM", "UNKNOWN"].includes(error?.code)) {
    return "Windows a refusé de lancer l’installeur. La mise à jour n’a pas été installée.";
  }
  if (/404/.test(error?.message || "")) return "La mise à jour n’est pas disponible sur le serveur. Réessaie plus tard.";
  return error?.message || "La mise à jour n’a pas abouti.";
}

function attemptStore(directory) {
  const file = path.join(directory, "update-attempt.json");
  return {
    async read() {
      try { return JSON.parse(await fs.readFile(file, "utf8")); }
      catch (error) { if (error.code === "ENOENT") return null; throw error; }
    },
    async write(attempt) {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(`${file}.tmp`, JSON.stringify(attempt), "utf8");
      await fs.rename(`${file}.tmp`, file);
    },
    async clear() { await fs.rm(file, { force: true }); },
  };
}

class UpdateManager {
  constructor({ updater, installedVersion, isPackaged, store, verifyInstaller, prepareInstall, cancelInstall, publish }) {
    Object.assign(this, { updater, installedVersion, isPackaged, store, verifyInstaller, prepareInstall, cancelInstall, publish });
    this.state = { status: "idle", installedVersion, version: "", percent: 0, message: "Aucune recherche lancée." };
    this.operation = null;
    this.downloadInfo = null;
    this.updater.autoDownload = false;
    // An ordinary close must never start another installation attempt.
    this.updater.autoInstallOnAppQuit = false;
    this.updater.autoRunAppAfterInstall = true;
    this.updater.allowDowngrade = false;
    updater.on("checking-for-update", () => this.set({ status: "checking", version: "", percent: 0, message: "Recherche d’une mise à jour…" }));
    updater.on("update-available", info => {
      if (info.version !== this.installedVersion) this.available(info);
    });
    updater.on("update-not-available", () => this.upToDate());
    updater.on("download-progress", progress => this.set({
      status: "downloading", percent: Math.min(100, Math.max(0, Math.round(progress.percent || 0))),
      message: `Téléchargement : ${Math.round(progress.percent || 0)} %`,
    }));
    updater.on("update-downloaded", info => {
      this.downloadInfo = info;
      this.set({ status: "downloaded", version: info.version, percent: 100, message: "Mise à jour téléchargée. Redémarre pour l’installer." });
    });
    updater.on("error", error => this.fail(error));
  }

  set(payload) {
    this.state = { ...this.state, ...payload, installedVersion: this.installedVersion };
    this.publish({ ...this.state });
    return this.getState();
  }
  getState() { return { ...this.state }; }
  available(info) { return this.set({ status: "available", version: info.version, percent: 0, message: `Mise à jour ${info.version} disponible.` }); }
  upToDate() { return this.set({ status: "not-available", version: "", percent: 0, message: `MindSet ${this.installedVersion} est à jour.` }); }
  fail(error) {
    if (this.state.status === "installing") this.cancelInstall();
    return this.set({ status: "error", message: updateMessage(error) });
  }

  async initialize() {
    try {
      const previous = await this.store.read();
      if (!previous) return this.getState();
      if (previous.version === this.installedVersion) {
        this.set({ status: "installed", message: `Mise à jour ${this.installedVersion} installée avec succès.` });
      } else if (previous.fromVersion === this.installedVersion) {
        this.set({ status: "error", version: previous.version, message: `L’installation de la version ${previous.version} n’a pas abouti. La version ${this.installedVersion} est toujours installée.` });
      }
      await this.store.clear();
    } catch {
      this.set({ status: "error", message: "Impossible de vérifier le résultat de la dernière installation. Tu peux rechercher les mises à jour." });
    }
    return this.getState();
  }

  run(action) {
    if (!this.isPackaged) return Promise.resolve(this.set({ status: "development", message: "Les mises à jour se font dans l’application Windows installée." }));
    if (this.operation) return this.operation;
    if (this.state.status === "installing") return Promise.resolve(this.getState());
    this.operation = Promise.resolve().then(action).catch(error => this.fail(error)).finally(() => { this.operation = null; });
    return this.operation;
  }

  check() {
    // Do not discard an already verified download just because Rechercher is clicked twice.
    if (this.state.status === "downloaded") return Promise.resolve(this.getState());
    return this.run(async () => {
      this.downloadInfo = null;
      const result = await this.updater.checkForUpdates();
      if (!result) throw new Error("Le serveur de mises à jour n’a pas répondu.");
      return result.isUpdateAvailable === true && result.updateInfo?.version !== this.installedVersion
        ? this.available(result.updateInfo) : this.upToDate();
    });
  }

  download() {
    if (this.state.status === "downloaded") return Promise.resolve(this.getState());
    return this.run(async () => {
      if (this.state.status !== "available") throw new Error("Recherche une mise à jour avant de la télécharger.");
      this.set({ status: "downloading", percent: 0, message: "Téléchargement : 0 %" });
      await this.updater.downloadUpdate();
      if (this.state.status !== "downloaded") throw new Error("Le téléchargement n’a pas été confirmé. Réessaie la recherche.");
      return this.getState();
    });
  }

  install() {
    return this.run(async () => {
      if (this.state.status !== "downloaded" || !this.downloadInfo || !this.updater.installerPath) {
        throw new Error("La mise à jour doit être téléchargée avant le redémarrage.");
      }
      this.set({ status: "installing", message: "Vérification de l’installeur…" });
      await this.verifyInstaller(this.updater.installerPath, this.downloadInfo);
      if (this.state.status !== "installing") return this.getState();
      this.set({ status: "installing", message: "Sauvegarde des notes avant le redémarrage…" });
      await this.prepareInstall();
      if (this.state.status !== "installing") return this.getState();
      await this.store.write({ fromVersion: this.installedVersion, version: this.downloadInfo.version });
      if (this.state.status !== "installing") return this.getState();
      this.set({ status: "installing", message: "Installation de la mise à jour…" });
      this.updater.quitAndInstall(false, true);
      return this.getState();
    });
  }
}

module.exports = { UpdateManager, attemptStore, updateMessage };
