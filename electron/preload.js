const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mindsetDesktop", {
  isDesktop: true,
  checkForUpdates: () => ipcRenderer.invoke("mindset:updates:check"),
  downloadUpdate: () => ipcRenderer.invoke("mindset:updates:download"),
  installUpdate: () => ipcRenderer.invoke("mindset:updates:install"),
  scanFontsFolder: () => ipcRenderer.invoke("mindset:fonts:scan-folder"),
  openFontsFolder: () => ipcRenderer.invoke("mindset:fonts:open-folder"),
  closeReady: (result = { ok: true }) => ipcRenderer.send("mindset:close-ready", result),
  onPrepareClose: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on("mindset:prepare-close", listener);
    return () => ipcRenderer.removeListener("mindset:prepare-close", listener);
  },
  onCloseCancelled: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on("mindset:close-cancelled", listener);
    return () => ipcRenderer.removeListener("mindset:close-cancelled", listener);
  },
  onUpdateStatus: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("mindset:update-status", listener);
    return () => ipcRenderer.removeListener("mindset:update-status", listener);
  },
});
