// main.js
// https://www.electronjs.org/docs/tutorial/quick-start

// Modules to control application life and create native browser window
const os = require("os");
const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const appConfig = require("./appConfig");
const steam = require("steamworks.js");

const osPlatform = os.platform();
// const isMac = osPlatform === "darwin";
// const isWindows = osPlatform === "win32";
// const isLinux = osPlatform === "linux";

try {
  // steamworks.js will read the app ID from steam_appid.txt in local dev
  // or in production, steam will inject the app ID when launching the game
  const steamClient = steam.init();
  const steamInfo = {
    appId: steamClient.utils.getAppId(),
    // cannot serialize entire "SteamID" struct because it contains a bigint
    userId: steamClient.localplayer.getSteamId().accountId,
    userName: steamClient.localplayer.getName(),
  };
  process.env.STEAM_INFO = JSON.stringify(steamInfo);
  ipcMain.handle("steam:achievement:activate", (_event, code) =>
    steamClient.achievement.activate(code),
  );
  ipcMain.handle("steam:achievement:check", (_event, code) =>
    steamClient.achievement.isActivated(code),
  );
  ipcMain.handle("steam:achievement:clear", (_event, code) =>
    steamClient.achievement.clear(code),
  );
  ipcMain.handle("steam:stats:increment", (_event, code) => {
    const curr = steamClient.stats.getInt(code) ?? 0;
    const next = curr + 1;
    const success = steamClient.stats.setInt(code, next);
    // todo maybe defer and batch later? but probably safe to spam for now
    steamClient.stats.store();
    return success ? next : curr;
  });
  ipcMain.handle("steam:stats:reset", (_event, code) =>
    steamClient.stats.setInt(code, 0),
  );
} catch (e) {
  console.error("preload: Steam initialization failed. Is Steam running?");
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
      preload: path.join(__dirname, "preload.js"),
    },
  });

  ipcMain.handle("electron:devtools", () =>
    mainWindow.webContents.openDevTools(),
  );
  ipcMain.handle("electron:fullscreen:true", () =>
    mainWindow.setFullScreen(true),
  );
  ipcMain.handle("electron:fullscreen:false", () =>
    mainWindow.setFullScreen(false),
  );

  mainWindow.setMenu(null);
  await mainWindow.loadFile("app/index.html");
}

// set some ipc handlers
// https://stackoverflow.com/a/68483354
ipcMain.handle("quit-app", () => app.quit());

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  await createWindow();
  if (appConfig.autoUpdate) {
    startCheckingForUpdates();
  }
});

// Quit when all windows are closed
app.on("window-all-closed", function () {
  app.quit();
});

// https://samuelmeuli.com/blog/2019-04-07-packaging-and-publishing-an-electron-app/#auto-update
function startCheckingForUpdates() {
  let downloadHasStarted = undefined;
  checkForUpdates();
  setInterval(
    async () => {
      if (downloadHasStarted) {
        return;
      }
      downloadHasStarted = !!(await checkForUpdates());
    },
    1000 * 60 * 5,
  );
}

async function checkForUpdates() {
  try {
    const result = await autoUpdater.checkForUpdatesAndNotify();
    // UpdateCheckResult is truthy if in packaged app
    // UpdateCheckResult.downloadPromise is truthy is update is available and download has started
    if (result && result.downloadPromise) {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.executeJavaScript(
          "window.ELECTRON_DOWNLOAD_STARTED = true;",
        );
        result.downloadPromise.then(() => {
          mainWindow.webContents.executeJavaScript(
            "window.ELECTRON_DOWNLOAD_COMPLETE = true;",
          );
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
