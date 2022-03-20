const deleter = require('delete');
const fetch = require('node-fetch');
const fs = require('fs');
const sevenBin = require('7zip-bin');
const { extractFull: sevenExtract } = require('node-7z');
const fsPromises = fs.promises;
const { fetchPath: path } = require('./path');
const pathTo7zip = sevenBin.path7za;

const downloadDist = async (version) => {
  const url = path.remoteDist(version);
  console.log('downloading:', url.split('/').slice(-1)[0]);
  await deleter.promise([path.tempDist]);
  const latestResp = await fetch(url);
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
  await new Promise((resolve, reject) => {
    const process = sevenExtract(path.tempDist, path.latestDist, {
      $bin: pathTo7zip,
    });
    process.on('end', () => resolve());
    process.on('error', () => reject());
  });
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
