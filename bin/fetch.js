const fs = require('fs');
const { fetchPath, downloadDist, unzipDist } = require('./path');
const fsPromises = fs.promises;

const fetchLatest = async () => {
  const packageFile = await fsPromises.readFile('package.json');
  const packageJson = JSON.parse(packageFile);
  const newVersion = packageJson.version;

  let oldAppVersion;
  try {
    console.log('checking for existing app:', fetchPath.existingVersionFile);
    const oldAppVersionRaw = await fsPromises.readFile(fetchPath.existingVersionFile);
    oldAppVersion = JSON.parse(oldAppVersionRaw).v;
    console.log('existing app found:', oldAppVersion);
  } catch (e) {
    // do nothing
    console.log('existing app not found');
  }

  console.log('checking if update needed:', oldAppVersion, newVersion);
  if (oldAppVersion && oldAppVersion === newVersion) {
    console.log('already up to date');
    return;
  }

  const url = fetchPath.versionUrl(newVersion);
  await downloadDist(url, fetchPath.tempDist);
  await unzipDist(fetchPath.tempDist, fetchPath.latestDist);
  console.log('done!');
};
fetchLatest();
