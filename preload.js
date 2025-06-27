const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getVersion: () => ipcRenderer.invoke('get-app-version'),

  // Subscribe to update events (renderer can react with UI)
  onUpdateAvailable: (callback) => {
    // Make sure the callback is actually a function!
    if (typeof callback === 'function') {
      ipcRenderer.on('update-available', () => callback());
    }
  },
  onUpdateDownloaded: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('update-downloaded', () => callback());
    }
  },
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install')
});
