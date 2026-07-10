const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("node:fs/promises");
const path = require("node:path");

let mainWindow = null;
let updateState = { status: "idle", message: "" };
let closeFlushState = null;
let closeRequestCounter = 0;

autoUpdater.autoDownload = false;
autoUpdater.setFeedURL({
  provider: "generic",
  url: "https://github.com/SxSevenXsX/MindSet/releases/latest/download/",
});

const supportedFontExtensions = new Set([".ttf", ".otf", ".woff", ".woff2"]);

function userFontsPath() {
  return path.join(app.getPath("userData"), "Fonts");
}

function safeFontId(value) {
  return String(value || "font").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "font";
}

function fontMimeType(extension) {
  if (extension === ".ttf") return "font/ttf";
  if (extension === ".otf") return "font/otf";
  if (extension === ".woff") return "font/woff";
  if (extension === ".woff2") return "font/woff2";
  return "application/octet-stream";
}

async function ensureUserFontsPath() {
  const folder = userFontsPath();
  await fs.mkdir(folder, { recursive: true });
  return folder;
}

async function readUserFontsFolder() {
  const folder = await ensureUserFontsPath();
  const entries = await fs.readdir(folder, { withFileTypes: true });
  const fonts = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    if (!supportedFontExtensions.has(extension)) continue;

    const filePath = path.join(folder, entry.name);
    const stat = await fs.stat(filePath);
    const buffer = await fs.readFile(filePath);
    const baseName = path.basename(entry.name, extension);
    const safeName = safeFontId(baseName);
    const stamp = `${stat.size}_${Math.round(stat.mtimeMs)}`;
    fonts.push({
      id: `desktop_${safeName}_${stamp}`,
      name: baseName,
      family: `MindSetLocal_${safeName}`,
      format: extension,
      dataUrl: `data:${fontMimeType(extension)};base64,${buffer.toString("base64")}`,
      source: "desktop-folder",
      path: filePath,
      size: stat.size,
      modifiedAt: Math.round(stat.mtimeMs),
    });
  }

  return { status: "ok", path: folder, fonts };
}

function sendUpdateStatus(payload) {
  updateState = { ...updateState, ...payload };
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("mindset:update-status", updateState);
}

function updateMessage(error) {
  if (!error) return "Erreur inconnue.";
  const message = error.message || String(error);
  if (message.includes("404")) {
    return "Mise a jour introuvable sur GitHub. Verifie que la release est publique et contient latest.yml, l'installateur .exe et le .blockmap.";
  }
  return message;
}

function updateAvailablePayload(info) {
  return {
    status: "available",
    version: info?.version || "",
    message: `Mise a jour ${info?.version || ""} disponible.`.replace("  ", " "),
  };
}

function configureFrenchSpellChecker(webContents) {
  const spellSession = webContents?.session;
  if (!spellSession) return;
  const available = spellSession.availableSpellCheckerLanguages || [];
  const french = available.find((language) => language.toLowerCase() === "fr-fr")
    || available.find((language) => /^fr(?:-|$)/i.test(language));
  if (french) spellSession.setSpellCheckerLanguages([french]);
}

function showSpellCheckerMenu(webContents, params) {
  if (!params?.isEditable || !params.spellcheckEnabled || !params.misspelledWord) return false;
  const suggestions = [...new Set(params.dictionarySuggestions || [])]
    .filter(Boolean)
    .slice(0, 8);
  const template = suggestions.length
    ? suggestions.map((suggestion) => ({
      label: suggestion,
      click: () => {
        if (!webContents.isDestroyed()) webContents.replaceMisspelling(suggestion);
      },
    }))
    : [{ label: "Aucune suggestion", enabled: false }];
  const popupOptions = {
    window: mainWindow,
    sourceType: params.menuSourceType,
  };
  if (params.frame) popupOptions.frame = params.frame;
  Menu.buildFromTemplate(template).popup(popupOptions);
  return true;
}

function externalWebUrl(value) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:" || protocol === "mailto:";
  } catch (error) {
    return false;
  }
}

function finishWindowClose() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (closeFlushState?.timer) clearTimeout(closeFlushState.timer);
  closeFlushState = { requested: true, allow: true, timer: null };
  mainWindow.close();
}

function cancelWindowClose(requestId, reason = "cancelled") {
  if (!mainWindow || mainWindow.isDestroyed() || closeFlushState?.requestId !== requestId) return;
  if (closeFlushState.timer) clearTimeout(closeFlushState.timer);
  closeFlushState = { requested: false, allow: false, timer: null, requestId: null };
  mainWindow.webContents.send("mindset:close-cancelled", { requestId, reason });
  mainWindow.show();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 640,
    title: "MindSet",
    backgroundColor: "#202020",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: !app.isPackaged,
      spellcheck: true,
    },
  });

  const webContents = mainWindow.webContents;
  closeFlushState = { requested: false, allow: false, timer: null, requestId: null };
  configureFrenchSpellChecker(webContents);
  webContents.on("context-menu", (event, params) => {
    if (!showSpellCheckerMenu(webContents, params)) return;
    event.preventDefault();
  });
  webContents.setWindowOpenHandler(({ url }) => {
    if (url === "about:blank") {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            preload: path.join(__dirname, "print-preload.js"),
          },
        },
      };
    }
    if (externalWebUrl(url)) shell.openExternal(url).catch(() => {});
    return { action: "deny" };
  });
  webContents.on("will-navigate", (event) => {
    const url = event.url;
    if (url === webContents.getURL()) return;
    event.preventDefault();
    if (externalWebUrl(url)) shell.openExternal(url).catch(() => {});
  });
  webContents.on("did-create-window", (childWindow) => {
    const childContents = childWindow.webContents;
    childContents.setWindowOpenHandler(() => ({ action: "deny" }));
    childContents.on("will-navigate", (event) => {
      const url = event.url;
      if (url === childContents.getURL()) return;
      event.preventDefault();
      if (externalWebUrl(url)) shell.openExternal(url).catch(() => {});
    });
  });

  mainWindow.on("close", (event) => {
    if (closeFlushState?.allow) return;
    event.preventDefault();
    if (closeFlushState?.requested) return;
    const requestId = String(++closeRequestCounter);
    closeFlushState = { requested: true, allow: false, timer: null, requestId };
    webContents.send("mindset:prepare-close", { requestId });
    closeFlushState.timer = setTimeout(() => cancelWindowClose(requestId, "timeout"), 30000);
  });
  mainWindow.on("unresponsive", async () => {
    const requestId = closeFlushState?.requested ? closeFlushState.requestId : null;
    if (!requestId || !mainWindow || mainWindow.isDestroyed()) return;
    const answer = await dialog.showMessageBox(mainWindow, {
      type: "warning",
      title: "MindSet ne repond pas",
      message: "La sauvegarde finale ne repond pas encore.",
      detail: "Forcer la fermeture peut perdre les toutes dernieres modifications.",
      buttons: ["Continuer a attendre", "Forcer la fermeture"],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    });
    if (answer.response === 1 && closeFlushState?.requestId === requestId) mainWindow.destroy();
  });
  webContents.on("render-process-gone", () => {
    if (closeFlushState?.requested && mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
  });
  mainWindow.on("closed", () => {
    if (closeFlushState?.timer) clearTimeout(closeFlushState.timer);
    closeFlushState = null;
    mainWindow = null;
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, "..", "index.html"));
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
}

autoUpdater.on("checking-for-update", () => {
  sendUpdateStatus({ status: "checking", percent: 0, message: "Recherche d'une mise a jour..." });
});

autoUpdater.on("update-available", (info) => {
  sendUpdateStatus(updateAvailablePayload(info));
});

autoUpdater.on("update-not-available", (info) => {
  sendUpdateStatus({
    status: "not-available",
    version: info.version,
    percent: 0,
    message: "MindSet est deja a jour.",
  });
});

autoUpdater.on("download-progress", (progress) => {
  sendUpdateStatus({
    status: "downloading",
    percent: Math.round(progress.percent || 0),
    message: `Telechargement : ${Math.round(progress.percent || 0)}%`,
  });
});

autoUpdater.on("update-downloaded", (info) => {
  sendUpdateStatus({
    status: "downloaded",
    version: info.version,
    percent: 100,
    message: "Mise a jour telechargee. Redemarre MindSet pour l'installer.",
  });
});

autoUpdater.on("error", (error) => {
  sendUpdateStatus({
    status: "error",
    message: updateMessage(error),
  });
});

ipcMain.handle("mindset:updates:check", async () => {
  if (!app.isPackaged) {
    return {
      status: "development",
      message: "Les mises a jour se testent dans la version installee, pas dans le mode developpement.",
    };
  }

  try {
    const result = await autoUpdater.checkForUpdates();
    if (result?.updateInfo?.version && result.updateInfo.version !== app.getVersion()) {
      const payload = updateAvailablePayload(result.updateInfo);
      updateState = { ...updateState, ...payload };
      return payload;
    }
    return updateState.status === "available" ? updateState : null;
  } catch (error) {
    return { status: "error", message: updateMessage(error) };
  }
});

ipcMain.handle("mindset:updates:download", async () => {
  if (!app.isPackaged) {
    return {
      status: "development",
      message: "Le telechargement de mise a jour se fait depuis l'app installee.",
    };
  }

  try {
    sendUpdateStatus({
      status: "downloading",
      percent: 0,
      message: "Telechargement : 0%",
    });
    await autoUpdater.downloadUpdate();
    return updateState.status === "downloaded" ? updateState : null;
  } catch (error) {
    return { status: "error", message: updateMessage(error) };
  }
});

ipcMain.handle("mindset:updates:install", () => {
  if (!app.isPackaged) {
    return {
      status: "development",
      message: "L'installation de mise a jour se fait depuis l'app installee.",
    };
  }

  autoUpdater.quitAndInstall(false, true);
  return { status: "installing", message: "Installation de la mise a jour..." };
});

ipcMain.handle("mindset:fonts:scan-folder", async () => {
  try {
    return await readUserFontsFolder();
  } catch (error) {
    return { status: "error", message: updateMessage(error), fonts: [] };
  }
});

ipcMain.handle("mindset:fonts:open-folder", async () => {
  try {
    const result = await readUserFontsFolder();
    const openError = await shell.openPath(result.path);
    if (openError) return { ...result, status: "error", message: openError };
    return { ...result, status: "opened" };
  } catch (error) {
    return { status: "error", message: updateMessage(error), fonts: [] };
  }
});

ipcMain.on("mindset:close-ready", (event, result = {}) => {
  if (
    !mainWindow
    || mainWindow.isDestroyed()
    || event.sender !== mainWindow.webContents
    || event.senderFrame !== mainWindow.webContents.mainFrame
    || !closeFlushState?.requested
  ) return;
  if (!result || typeof result !== "object") result = { ok: false };
  if (String(result.requestId || "") !== closeFlushState.requestId) return;
  if (result.ok !== true) {
    cancelWindowClose(closeFlushState.requestId, "renderer-error");
    return;
  }
  finishWindowClose();
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
