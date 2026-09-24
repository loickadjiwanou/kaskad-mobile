// Pont minimal et typé entre l'app web et le process principal (contextIsolation + sandbox).
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kaskad", {
    isElectron: true,
    platform: process.platform,

    download: (options) => ipcRenderer.invoke("kaskad:download", options),
    pause: (id) => ipcRenderer.invoke("kaskad:pause", id),
    cancel: (id) => ipcRenderer.invoke("kaskad:cancel", id),
    onDownloadProgress: (callback) => {
        const listener = (_event, id, received, total) => callback(id, received, total);
        ipcRenderer.on("kaskad:download-progress", listener);
        return () => ipcRenderer.removeListener("kaskad:download-progress", listener);
    },

    showInFolder: (filePath) => ipcRenderer.invoke("kaskad:show-in-folder", filePath),
    fileExists: (filePath) => ipcRenderer.invoke("kaskad:file-exists", filePath),
    removeFile: (filePath) => ipcRenderer.invoke("kaskad:remove-file", filePath),
    sha256: (filePath) => ipcRenderer.invoke("kaskad:sha256", filePath),
    setBadge: (count) => ipcRenderer.invoke("kaskad:set-badge", count),
});
