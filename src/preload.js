// preload.js
// https://www.electronjs.org/docs/tutorial/quick-start

const { ipcRenderer, contextBridge } = require("electron");
const steam = require("steamworks.js");

console.log("running preload...");

for (const dependency of ["chrome", "node", "electron"]) {
  console.log(`${dependency}-version`, process.versions[dependency]);
}

// https://www.electronjs.org/docs/latest/tutorial/tutorial-preload
contextBridge.exposeInMainWorld("ELECTRON_API", {
  setFullScreen: (bool) =>
    ipcRenderer.invoke(
      bool ? "electron:fullscreen:true" : "electron:fullscreen:false",
    ),
  // https://stackoverflow.com/a/68483354
  exit: () => ipcRenderer.invoke("quit-app"),
});

let steamClient;
try {
  // steamworks.js will read the app ID from steam_appid.txt in local dev
  // or in production, steam will inject the app ID when launching the game
  steamClient = steam.init();
  contextBridge.exposeInMainWorld("ELECTRON_STEAM", {
    appId: steamClient.utils.getAppId(),
    userId: steamClient.localplayer.getSteamId().accountId,
    userName: steamClient.localplayer.getName(),
  });
} catch (e) {
  console.error("preload: Steam initialization failed. Is Steam running?");
  console.error(e);
}

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
  // todo unused
});
