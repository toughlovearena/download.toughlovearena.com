const { debugPath, downloadDist } = require('./path');

const fetchDebug = async () => {
  await downloadDist(debugPath.url, debugPath.tempDist);
  await unzipDist(debugPath.tempDist, debugPath.latestDist);
  console.log('done!');
};
fetchDebug();
