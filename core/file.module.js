const unzip = require('unzip-stream');
const fs = require('fs');

const basePath = (path) => `${process.cwd()}/${path}`;

const oldPath = basePath('vtescsv/old');
const newPath = basePath('vtescsv/new');
const zipPath = basePath('vtescsv/vtescsv_utf8.zip');

const extract = (done, failed) => {
  fs.createReadStream(zipPath).pipe(
    unzip
      .Extract({ path: newPath })
      .on('close', () => {
        console.log('CSV Files Extracted');
        done();
      })
      .on('error', () => failed(new Error('Unzip Failed'))),
  );
};

const move = (done, failed) => {
  fs.readdir(newPath, (readErr, files) => {
    if (readErr) {
      failed(readErr);
      return;
    }
    files.forEach((file) => {
      const from = `${newPath}/${file}`;
      const to = `${oldPath}/${file}`;

      fs.rename(from, to, function (err) {
        if (err) {
          if (err.code === 'EXDEV') {
            copy(done, failed);
          } else {
            failed(err);
          }
          return;
        }
        done();
        console.log('CSV files updated');
      });
    });
  });
};

const copy = (done, failed) => {
  var readStream = fs.createReadStream(newPath);
  var writeStream = fs.createWriteStream(oldPath);

  readStream.on('error', failed);
  writeStream.on('error', failed);

  readStream.on('close', function () {
    fs.unlink(newPath, done);
    console.log('CSV files updated with copy method');
  });

  readStream.pipe(writeStream);
};

const getCSVFiles = async () => {
  await new Promise(move);
  await new Promise(extract);
};

const getZipDate = async () => {
  return new Promise(getDate);
};

const getDate = (done, failed) => {
  fs.stat(zipPath, (err, stats) => {
    if (err) failed();
    done(stats.mtime);
  });
};

module.exports = { basePath, getCSVFiles, getZipDate };
