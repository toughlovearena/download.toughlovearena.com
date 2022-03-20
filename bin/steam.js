const extractDmg = require("extract-dmg");
const deleter = require('delete');
const fetch = require('node-fetch');
const fs = require('fs');
const fsPromises = fs.promises;
const { steamPath: path } = require('./path');

const downloadMac = async (version) => {
  const url = path.releaseMacUrlDmg(version);
  console.log('downloading:', url.split('/').slice(-1)[0]);
  await deleter.promise([path.releaseMacTempDmg]);
  const latestResp = await fetch(url);
  if (latestResp.status !== 200) {
    throw new Error('Response status was ' + latestResp.status);
  }
  const stream = fs.createWriteStream(path.releaseMacTempDmg);
  await new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', resolve);
    latestResp.body.pipe(stream);
  });
  console.log('finished download');
};

const unzipMac = async () => {
  console.log('unzipping...');
  await deleter.promise([path.releaseMacTempOut]);
  await extractDmg(path.releaseMacTempDmg, path.releaseMacTempOut);
  await deleter.promise([path.releaseMacTempDmg]);
}

const fetchLatest = async () => {
  const packageFile = await fsPromises.readFile(path.packageJson);
  const packageJson = JSON.parse(packageFile);
  const newVersion = packageJson.version;

  console.log(newVersion);
  await downloadMac(newVersion);
  await unzipMac();

  console.log('done!');
};
fetchLatest();
