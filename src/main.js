// main.js
// https://www.electronjs.org/docs/tutorial/quick-start

// Modules to control application life and create native browser window
const os = require('os');
const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require("electron-updater");
const path = require('path');
const appConfig = require('./appConfig');
const steam = require('steamworks.js');

const osPlatform = os.platform();
// const isMac = osPlatform === "darwin";
// const isWindows = osPlatform === "win32";
// const isLinux = osPlatform === "linux";

let steamClient;
try {
  // steamworks.js will read the app ID from steam_appid.txt in local dev
  // or in production, steam will inject the app ID when launching the game
  steamClient = steam.init();
  steam.electronEnableSteamOverlay();
} catch (e) {
  console.error('Steam initialization failed. Is Steam running?');
  console.error(e);
}

async function createWindow() {
  // todo disable security for mod files?
  // https://lifesaver.codes/answer/not-allowed-to-load-local-resource

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: `Tough Love Arena | ${osPlatform}`, // overridden once page finishes loading
    width: 1600,
    height: 900,
    // fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      // devTools: !appConfig.isSteam,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.setMenu(null)
  await mainWindow.loadFile('app/index.html');

  ipcMain.handle('electron:fullscreen:true', () => mainWindow.setFullScreen(true));
  ipcMain.handle('electron:fullscreen:false', () => mainWindow.setFullScreen(false));
}

// set some ipc handlers
// https://stackoverflow.com/a/68483354
ipcMain.handle('quit-app', () => app.quit());

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  await createWindow();
  if (appConfig.autoUpdate) {
    startCheckingForUpdates();
  }
})

// Quit when all windows are closed
app.on('window-all-closed', function () {
  app.quit();
})

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
