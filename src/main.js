// main.js
// https://www.electronjs.org/docs/tutorial/quick-start

// Modules to control application life and create native browser window
const os = require('os');
const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require("electron-updater");
const path = require('path');
const appConfig = require('./appConfig');

const osPlatform = os.platform();
// const isMac = osPlatform === "darwin";
// const isWindows = osPlatform === "win32";
// const isLinux = osPlatform === "linux";

function createWindow() {
  // todo disable security for mod files?
  // https://lifesaver.codes/answer/not-allowed-to-load-local-resource

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: `Tough Love Arena | ${osPlatform}`, // overridden once page finishes loading
    width: 1280,
    height: 720,
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: !appConfig.isSteam,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  const loadPromise = mainWindow.loadFile('app/index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // after load is complete, set window variables
  loadPromise.then(() => {
    // for debugging
    // mainWindow.webContents.executeJavaScript(`window.ELECTRON_DEBUG_APP_CONFIG = ${JSON.stringify(appConfig)};`);
    if (appConfig.isSteam) {
      mainWindow.webContents.executeJavaScript(`window.ELECTRON_IS_STEAM = true;`);
    }
  });

  // return promise
  return loadPromise;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  await createWindow();

  if (appConfig.autoUpdate) {
    startCheckingForUpdates();
  }

  app.on('activate', async () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
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

// Communicate with preload.js
// https://stackoverflow.com/a/68483354
ipcMain.handle('quit-app', () => {
  app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// https://samuelmeuli.com/blog/2019-04-07-packaging-and-publishing-an-electron-app/#auto-update
function startCheckingForUpdates() {
  let downloadHasStarted = undefined;
  checkForUpdates();
  setInterval(async () => {
    if (downloadHasStarted) { return; }
    downloadHasStarted = !!(await checkForUpdates());
  }, 1000 * 60 * 5);
};

async function checkForUpdates() {
  try {
    const result = await autoUpdater.checkForUpdatesAndNotify();
    // UpdateCheckResult is truthy if in packaged app
    // UpdateCheckResult.downloadPromise is truthy is update is available and download has started
    if (result && result.downloadPromise) {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.executeJavaScript("window.ELECTRON_DOWNLOAD_STARTED = true;");
        result.downloadPromise.then(() => {
          mainWindow.webContents.executeJavaScript("window.ELECTRON_DOWNLOAD_COMPLETE = true;");
        });
      }
      return result.downloadPromise;
    }
  } catch (err) {
    // Ignore errors thrown because user is not connected to internet
    const ignore = [
      "net::ERR_INTERNET_CHANGED",
      "net::ERR_INTERNET_DISCONNECTED",
    ];
    if (ignore.includes(err.message)) {
      // swallow
    } else {
      throw err;
    }
  }
}
