const deleter = require('delete');
const fetch = require('node-fetch');
const fs = require('fs');
const sevenBin = require('7zip-bin');
const { extractFull: sevenExtract } = require('node-7z');
const { steamPath: path } = require('./path');

const fsPromises = fs.promises;
const pathTo7zip = sevenBin.path7za;

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
  console.log('unzipping:', path.releaseMacTempDmg);
  await deleter.promise([path.releaseMacTempOut]);
  await new Promise((resolve, reject) => {
    const process = sevenExtract(path.releaseMacTempDmg, path.releaseMacTempOut, {
      $bin: pathTo7zip,
    });
    process.on('end', () => resolve());
    process.on('error', () => reject());
  });
  console.log('unzipped to:', path.releaseMacTempOut);
  await deleter.promise([path.releaseMacTempDmg]);
}

const fetchLatest = async () => {
  try {
    const packageFile = await fsPromises.readFile(path.packageJson);
    const packageJson = JSON.parse(packageFile);
    const newVersion = packageJson.version;

    console.log(newVersion);
    await downloadMac(newVersion);
    await unzipMac();

    console.log('done!');
  } catch (err) {
    console.log('there was an error!');
    console.error(error);
    process.exit(1);
  }
};
fetchLatest();
