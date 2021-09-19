// preload.js
// https://www.electronjs.org/docs/tutorial/quick-start

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  console.log('running preload...');
  for (const dependency of ['chrome', 'node', 'electron']) {
    console.log(`${dependency}-version`, process.versions[dependency]);
  }
});

