const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mindsetDesktop", {
  isDesktop: true,
  checkForUpdates: () => ipcRenderer.invoke("mindset:updates:check"),
  downloadUpdate: () => ipcRenderer.invoke("mindset:updates:download"),
  installUpdate: () => ipcRenderer.invoke("mindset:updates:install"),
  scanFontsFolder: () => ipcRenderer.invoke("mindset:fonts:scan-folder"),
  openFontsFolder: () => ipcRenderer.invoke("mindset:fonts:open-folder"),
  onUpdateStatus: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("mindset:update-status", listener);
    return () => ipcRenderer.removeListener("mindset:update-status", listener);
  },
});
