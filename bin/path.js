const deleter = require('delete');
const fetch = require('node-fetch');
const fs = require('fs');
const sevenBin = require('7zip-bin');
const { extractFull: sevenExtract } = require('node-7z');
const pathTo7zip = sevenBin.path7za;

const debugPath = {
  latestDist: 'app',
  tempDist: 'debug.7z',
  url: `https://data.toughlovearena.cloud/debug/dev-latest.7z`,
};
const fetchPath = {
  existingVersionFile: 'app/version.json',
  latestDist: 'app',
  tempDist: 'fetch.7z',
  versionUrl: version => `https://data.toughlovearena.cloud/zip/${version}.7z`,
};

function replaceLine(path, before, after) {
  const jsFile = fs.readFileSync(path, 'utf-8');
  const lines = jsFile.split('\n');
  const newLines = lines.map((line) => {
    if (line.includes(before)) {
      return line.replace(before, after);
    }
    return line;
  });
  fs.writeFileSync(path, newLines.join('\n'), 'utf-8');
}

const downloadDist = async (url, zipPath) => {
  console.log('downloading:', url.split('/').slice(-1)[0]);
  await deleter.promise([zipPath]);
  const latestResp = await fetch(url);
  if (latestResp.status !== 200) {
    throw new Error('Response status was ' + latestResp.status);
  }
  const stream = fs.createWriteStream(zipPath);
  await new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', resolve);
    latestResp.body.pipe(stream);
  });
  console.log('finished download');
};

const unzipDist = async (zipPath, destPath) => {
  console.log('unzipping...');
  await deleter.promise([destPath]);
  await new Promise((resolve, reject) => {
    const process = sevenExtract(zipPath, destPath, {
      $bin: pathTo7zip,
    });
    process.on('end', () => resolve());
    process.on('error', () => reject());
  });
  await deleter.promise([zipPath]);
}

module.exports = {
  debugPath,
  fetchPath,
  replaceLine,
  downloadDist,
  unzipDist,
};
