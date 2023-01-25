// preload.js
// https://www.electronjs.org/docs/tutorial/quick-start

const { ipcRenderer, contextBridge } = require("electron");

// https://www.electronjs.org/docs/latest/tutorial/tutorial-preload
contextBridge.exposeInMainWorld('ELECTRON_API', {
  // https://stackoverflow.com/a/68483354
  exit: () => ipcRenderer.invoke('quit-app'),
});

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  console.log('running preload...');
  for (const dependency of ['chrome', 'node', 'electron']) {
    console.log(`${dependency}-version`, process.versions[dependency]);
  }
});
