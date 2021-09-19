const fs = require('fs');

const path = {
  latestDist: 'app',
  latestVersion: 'app/version.json',
  tempDist: 'fetch.zip',
  packageJson: 'package.json',
  remoteVersion: 'http://storage.googleapis.com/fighter-html/version.json',
  remoteDist: (version) => `http://storage.googleapis.com/fighter-html/${version}.zip`,
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
  path,
  replaceLine,
};
