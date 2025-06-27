const { app, BrowserWindow } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  win.loadFile('app-home.html');

  // Remove menu bar
  win.setMenuBarVisibility(false);
  win.removeMenu();
}

// App ready event
app.whenReady().then(() => {
  createWindow();

  // Check for updates and notify user (logs to console by default)
  autoUpdater.checkForUpdatesAndNotify();

  // Optional: Log update events (for development)
  autoUpdater.on('update-available', () => {
    console.log('Update available!');
    // Optionally send info to renderer for custom UI
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded!');
    // Optionally notify user that a restart is required
  });
});

// Quit on all windows closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
