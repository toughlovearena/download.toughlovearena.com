const decompress = require('decompress');
const deleter = require('delete');
const fetch = require('node-fetch');
const fs = require('fs');
const fsPromises = fs.promises;
const { path } = require('./path');

const downloadDist = async (version) => {
  console.log('downloading:', version);
  await deleter.promise([path.tempDist]);
  const latestResp = await fetch(path.remoteDist(version));
  if (latestResp.status !== 200) {
    throw new Error('Response status was ' + latestResp.status);
  }
  const stream = fs.createWriteStream(path.tempDist);
  await new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', resolve);
    latestResp.body.pipe(stream);
  });
  console.log('finished download');
};

const unzipDist = async () => {
  console.log('unzipping...');
  await deleter.promise([path.latestDist]);
  await decompress(path.tempDist, path.latestDist);
  await deleter.promise([path.tempDist]);
}

const fetchLatest = async () => {
  const packageFile = await fsPromises.readFile(path.packageJson);
  const packageJson = JSON.parse(packageFile);
  const newVersion = packageJson.version;

  let oldAppVersion;
  try {
    const oldAppVersionRaw = await fsPromises.readFile(path.latestVersion);
    oldAppVersion = JSON.parse(oldAppVersionRaw).v;
  } catch (e) {
    // do nothing
  }

  console.log(oldAppVersion, newVersion);
  if (!oldAppVersion || oldAppVersion !== newVersion) {
    await downloadDist(newVersion);
    await unzipDist();
  } else {
    console.log('already up to date');
  }

  console.log('done!');
};
fetchLatest();
