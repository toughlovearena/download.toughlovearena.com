// main.js
// https://www.electronjs.org/docs/tutorial/quick-start

// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require("electron-updater");
const path = require('path');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // and load the index.html of the app.
  mainWindow.loadFile('app/index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  // we want to close app, even on mac
  // if (process.platform !== 'darwin') {
  app.quit();
  // }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// https://samuelmeuli.com/blog/2019-04-07-packaging-and-publishing-an-electron-app/#auto-update
app.on("ready", () => {
  checkForUpdates();
  setInterval(() => {
    checkForUpdates();
  }, 1000 * 60 * 5);
});

async function checkForUpdates() {
  try {
    await autoUpdater.checkForUpdatesAndNotify();
  } catch (err) {
    // Ignore errors thrown because user is not connected to internet
    if (err.message !== "net::ERR_INTERNET_DISCONNECTED") {
      throw err;
    }
  }
}
