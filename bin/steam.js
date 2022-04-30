const deleter = require('delete');
const fetch = require('node-fetch');
const fs = require('fs');
const sevenBin = require('7zip-bin');
const { extractFull: sevenExtract } = require('node-7z');
const { steamPath: path } = require('./path');

const fsPromises = fs.promises;
const pathTo7zip = sevenBin.path7za;

const downloadRelease = async (url, filePath) => {
  console.log('downloading:', url.split('/').slice(-1)[0]);
  await deleter.promise([filePath]);
  const latestResp = await fetch(url);
  if (latestResp.status !== 200) {
    throw new Error('Response status was ' + latestResp.status);
  }
  const stream = fs.createWriteStream(filePath);
  await new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', resolve);
    latestResp.body.pipe(stream);
  });
  console.log('finished download');
};

const unzipRelease = async (zipPath, destFolder) => {
  console.log('unzipping:', zipPath);
  await deleter.promise([destFolder]);
  await new Promise((resolve, reject) => {
    const process = sevenExtract(zipPath, destFolder, {
      $bin: pathTo7zip,
    });
    process.on('end', () => resolve());
    process.on('error', () => reject());
  });
  console.log('unzipped to:', destFolder);
  await deleter.promise([zipPath]);
}

const prepareWindows = async (version) => {
  const url = path.releaseWindowsUrl(version);
  const filePath = `${path.releaseWindowsDepot}/${path.releaseWindowsExe}`;
  await downloadRelease(url, filePath);
}

const prepareMac = async (version) => {
  const url = path.releaseMacUrl(version);
  const filePath = path.releaseMacZip;
  const depot = path.releaseMacDepot;
  await downloadRelease(url, filePath);
  await unzipRelease(filePath, depot);
}

const prepareLinux = async (version) => {
  const url = path.releaseLinuxUrl(version);
  const filePath = `${path.releaseLinuxDepot}/${path.releaseLinuxAppImage}`;
  await downloadRelease(url, filePath);
}

const fetchLatest = async () => {
  try {
    const packageFile = await fsPromises.readFile(path.packageJson);
    const packageJson = JSON.parse(packageFile);
    const newVersion = packageJson.version;

    console.log(newVersion);
    // await prepareWindows(newVersion);
    await prepareMac(newVersion);
    await prepareLinux(newVersion);

    console.log('done!');
  } catch (err) {
    console.log('there was an error!');
    console.error(err);
    process.exit(1);
  }
};
fetchLatest();
