const fs = require('fs');

const fetchPath = {
  packageJson: 'package.json',
  latestDist: 'app',
  latestVersion: 'app/version.json',
  tempDist: 'fetch.7z',
  remoteVersion: 'http://storage.googleapis.com/fighter-html/version.json',
  remoteDist: version => `http://storage.googleapis.com/fighter-html/${version}.7z`,
};
const steamPath = {
  packageJson: 'package.json',
  releaseMacTempDmg: 'steam-osx.zip',
  releaseMacTempOut: 'steam/osx',
  releaseMacUrlDmg: version => `https://github.com/toughlovearena/download.toughlovearena.com/releases/download/v${version}/Tough-Love-Arena-${version}-mac.zip`,
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

module.exports = {
  fetchPath,
  steamPath,
  replaceLine,
};
