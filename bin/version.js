const fetch = require('node-fetch');
const fs = require('fs');
const fsPromises = fs.promises;
const { path, replaceLine } = require('./path');

const updateVersion = async () => {
  const resp = await fetch(path.remoteVersion);
  const latestVersion = await resp.json();

  const packageFile = await fsPromises.readFile(path.packageJson);
  const packageJson = JSON.parse(packageFile);

  const oldVersion = packageJson.version;
  const newVersion = latestVersion.version;
  console.log(oldVersion, newVersion);
  if (!latestVersion.version) {
    return;
  }

  replaceLine(path.packageJson, `"version": "${oldVersion}",`, `"version": "${newVersion}",`);
}
updateVersion();
