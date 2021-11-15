const { getCSVFiles, getZipDate } = require('./core/file.module.js');
const { getHeader, download } = require('./core/request.module.js');
const { getCardLists } = require('./core/csv.module.js');
const { getEnv, hasEnv } = require('./core/process.module.js');
const { exec } = require('child_process');

const diff = require('./core/diff.module.js');
const allSets = require('./core/allSets.module.js');

const url = 'https://www.vekn.net/images/stories/downloads/vtescsv_utf8.zip';

function showWindowsNotification(title, text, exit = false) {
  exec(
    `powershell.exe "& '.\\notification.ps1' -title '${title}' -text '${text}'"`,
    () => {
      if (exit) process.exit();
    },
  );
}

(async () => {
  try {
    console.log();

    // Gets header info from ZIP file on vekn.net without downloading it
    const header = await getHeader(url);

    const fileTimestamp = new Date(header['last-modified']).valueOf();
    const currentTimestampPromise = await getZipDate();
    const currentTimestamp = currentTimestampPromise.valueOf();

    // Checks if ZIP file is newer than the current one, or keep going if --force env arg is present
    if (fileTimestamp <= currentTimestamp && !hasEnv('--force')) {
      console.log('Download not needed');
      return showWindowsNotification(
        'LackeyCCG Updater',
        'Não há atualizações do CSV disponíveis',
        true,
      );
    }

    // TESTANDO node . --force -teste="Fala sério, cara"
    console.log(getEnv('-teste'));

    // Downloads ZIP containing CSV files from vekn.net
    await download(url);

    // Extracts CSV files from downloaded zip into vtescsv directory structure
    await getCSVFiles();

    // Gets CSV (current and downloaded) content in JSON format
    const cardLists = await getCardLists();

    // Checks if there are changes between current and downloaded CSV files
    const results = diff.get(cardLists);

    if (results.totalChanges > 0 || hasEnv('--force')) {
      // Generates allSets file from new CSV in vtes-plugin/high directory
      await allSets.generate();

      // Validates if all cards are present in allsets.txt file
      const missingCards = allSets.integrityCheck(cardLists);

      // Prints cards missing from allsets.txt
      console.log(missingCards);

      // Prints card lists in fileName format
      console.log(results.affectedCards);

      showWindowsNotification(
        'LackeyCCG Updater',
        `CSV foi atualizado na VEKN com ${results.affectedCards.length} alterações`,
        true,
      );

      //TODO: Create new uninstall.txt based on affected cards
      //TODO: Create new version.txt file
      //TODO: Create new changelog.txt file
      //TODO: Create new setlist.txt file if needed
      //TODO: Copy generated txts to lackeyccg-dev counterpart folder for checksum
    } else {
      showWindowsNotification(
        'LackeyCCG Updater',
        'CSV foi atualizado na VEKN, mas não há alterações',
        true,
      );
    }
  } catch (e) {
    console.error(e);
  }
})();
