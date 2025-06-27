const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let win; // make win available to the whole file

function createWindow () {
  win = new BrowserWindow({
    width: 1280,
    height: 900,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,       // secure!
      contextIsolation: true,       // secure!
      preload: path.join(__dirname, 'preload.js')
    }
  });
  




  Menu.setApplicationMenu(null);
  win.loadFile('app-home.html');

  if (!app.isPackaged) return;

  // ---- AUTO-UPDATER EVENTS ----
  autoUpdater.checkForUpdatesAndNotify();

  // Inform renderer: update available
autoUpdater.on('update-available', () => {
  if (win) win.webContents.send('update-available');
  // No dialog.showMessageBox
});


  // Inform renderer: update downloaded
autoUpdater.on('update-downloaded', () => {
  if (win) win.webContents.send('update-downloaded');
  // Remove or comment out dialog.showMessageBox here too
});

}

// App ready
app.whenReady().then(createWindow);

// Expose version for footer
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('quit-and-install', () => {
  autoUpdater.quitAndInstall();
});


// Standard quit logic
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
