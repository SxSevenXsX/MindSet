const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("node:fs/promises");
const path = require("node:path");

let mainWindow = null;
let updateState = { status: "idle", message: "" };

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
    },
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

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
