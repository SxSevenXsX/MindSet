const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("node:fs/promises");
const path = require("node:path");
const { UpdateManager, attemptStore, updateMessage } = require("./update-manager");
const { CloseCoordinator } = require("./close-coordinator");
const { verifyInstaller } = require("./verify-installer");

let mainWindow = null;
let updateManager = null;
let closeCoordinator = null;

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
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("mindset:update-status", payload);
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
  closeCoordinator = new CloseCoordinator({
    send: (channel, payload) => { if (!webContents.isDestroyed()) webContents.send(channel, payload); },
  });
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
    if (closeCoordinator?.allowed) return;
    event.preventDefault();
    if (updateManager?.getState().status === "installing") return;
    if (closeCoordinator?.pending) return;
    closeCoordinator.request("close").then(() => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
    }).catch(() => {});
  });
  mainWindow.on("unresponsive", async () => {
    const requestId = closeCoordinator?.pending?.requestId || null;
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
    if (answer.response === 1 && closeCoordinator?.pending?.requestId === requestId) mainWindow.destroy();
  });
  webContents.on("render-process-gone", () => {
    if (closeCoordinator?.pending && mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
  });
  mainWindow.on("closed", () => {
    closeCoordinator?.dispose();
    closeCoordinator = null;
    mainWindow = null;
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, "..", "index.html"));
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
}

for (const [channel, action] of Object.entries({
  "mindset:updates:state": "getState",
  "mindset:updates:check": "check",
  "mindset:updates:download": "download",
  "mindset:updates:install": "install",
})) {
  ipcMain.handle(channel, (event) => {
    if (!mainWindow || event.sender !== mainWindow.webContents
      || event.senderFrame !== mainWindow.webContents.mainFrame) throw new Error("Fenêtre non autorisée.");
    return updateManager[action]();
  });
}

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
    || !closeCoordinator?.pending
  ) return;
  if (!result || typeof result !== "object") result = { ok: false };
  closeCoordinator.acknowledge(result.requestId, result.ok === true);
});

app.whenReady().then(async () => {
  updateManager = new UpdateManager({
    updater: autoUpdater, installedVersion: app.getVersion(), isPackaged: app.isPackaged,
    store: attemptStore(app.getPath("userData")), verifyInstaller,
    prepareInstall: () => closeCoordinator.request("update"),
    cancelInstall: () => {
      if (closeCoordinator?.allowed || closeCoordinator?.pending?.purpose === "update") closeCoordinator.cancel("update-error");
    },
    publish: sendUpdateStatus,
  });
  await updateManager.initialize();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
