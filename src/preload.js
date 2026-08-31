// preload.js
// https://www.electronjs.org/docs/tutorial/quick-start

const { ipcRenderer, contextBridge } = require("electron");

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
  devtools: () => ipcRenderer.invoke("electron:devtools"),
});

const steamEnv = process.env.STEAM_INFO;
console.log("steam env:", steamEnv);
if (steamEnv) {
  const steamInfo = JSON.parse(steamEnv);
  contextBridge.exposeInMainWorld("ELECTRON_STEAM", {
    info: steamInfo,
    achievement: {
      activate: (code) =>
        ipcRenderer.invoke("steam:achievement:activate", code),
      check: (code) => ipcRenderer.invoke("steam:achievement:check", code),
      clear: (code) => ipcRenderer.invoke("steam:achievement:clear", code),
    },
    stats: {
      increment: (code) => ipcRenderer.invoke("steam:stats:increment", code),
      reset: (code) => ipcRenderer.invoke("steam:stats:reset", code),
    },
  });
}

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
  // todo unused
});
