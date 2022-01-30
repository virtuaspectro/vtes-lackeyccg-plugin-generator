const https = require('https');

let done;
let failed;

const KRCG_FILE_LIST = 'https://static.krcg.org/card/';

const makeRequest = (url, method, body) => {
  let output = '';
  const request = https.request(url, { method, body }, (res) => {
    res.on('data', (data) => (output += data));
  });
  request.on('error', failed);
  request.on('close', () => {
    processImageList(output);
  });
  request.end();
};

const processImageList = (dataHTML) => {
  const dataRaw = dataHTML.split('\n');

  const cardArray = dataRaw.map((data) => {
    const isCard = /(\d{2}-[A-z]{3}-\d{4} \d{2}:\d{2})/.test(data);
    const isDirectory = /(href\=\"[a-z]{2,3}\/\")/.test(data);

    if (isCard && !isDirectory) {
      const entry = String(data)
        .replace(
          /^(.*)(href=")(.*)(")(.*)(\d{2}-[A-z]{3}-\d{4} \d{2}:\d{2})(.*)/,
          '$3|$6',
        )
        .split('|');

      return { card: entry[0], date: Date.parse(entry[1]) };
    }
  });

  const dates = Array.from(
    new Set(cardArray.filter(Boolean).map((item) => item.date)),
  );

  done(new Date(dates.sort((a, b) => b - a)[0]).toGMTString().substring(5, 16));
};

const createRequest = (url, method = 'HEAD', body = null) => {
  return new Promise((resolve, reject) => {
    done = resolve;
    failed = reject;
    makeRequest(url, method, body);
  });
};

const hasImagesAvailable = () => {
  return createRequest(KRCG_FILE_LIST, 'GET');
};

module.exports = { hasImagesAvailable };
