const csv = require('csvtojson');
const fs = require('fs');
const { basePath } = require('./file.module');

module.exports = {
  CSV_FILES: ['vtescrypt.csv', 'vteslib.csv'],
  csvPath: function (fileName) {
    return basePath(`vtescsv/new/${fileName}`);
  },
  allSetsPath: function () {
    return basePath(`vtes-plugin/high/allsets.txt`);
  },
  parser: function (json) {
    const samples = [];
    let previousCardName = '';
    let previousCardGroup = 0;

    json.forEach((card) => {
      try {
        const text = card['Card Text'];
        const expansions = this.parseCardSet(card.Set, card.Type);
        const cardText = text ? text.replace(/(?:\r\n|\r|\n)/g, ' ') : '';
        const formattedCardName = this.formatCardName(
          card.Name,
          card.Adv,
          card.Group,
          previousCardName,
          previousCardGroup,
        );

        const cardData = [
          formattedCardName,
          expansions.firstSet,
          this.getImageFileName(formattedCardName, card.Type),
          expansions.lastSet.split('-')[0],
          card.Type,
          card.Clan,
          card.Group,
          card.Capacity,
          card.Disciplines || card.Discipline,
          card.PoolCost,
          card.BloodCost,
          this.removeSpecialChars(cardText),
          card.Set.replace(/Promo-\d+/, 'Promo'),
          this.removeSpecialChars(card.Artist),
        ];

        // Store previous name for group comparison (Victoria Ash, Gilbert Duane, etc)
        previousCardName = card.Name;
        previousCardGroup = card.Group;

        samples.push(cardData.join('\t'));
      } catch (e) {
        console.error(e);
      }
    });
    return samples.join('\n');
  },
  formatCardName: function (name, adv, group, previousName, previousGroup) {
    let formattedCardName = this.removeSpecialChars(name);
    if (adv) formattedCardName += ' (ADV)';
    if (name === previousName && group !== previousGroup)
      formattedCardName += ` (G${group})`;
    return formattedCardName;
  },
  parseCardSet: function (set, type) {
    const setList = set.split(',');
    const setSize = setList.length;
    let lastSet = setList[setSize - 1].split(':')[0];
    let firstSet = setList[0].split(':')[0].split('-')[0];

    if (this.isCrypt(type)) firstSet += 'M';

    return { firstSet, lastSet };
  },
  isCrypt: function (type) {
    return ['Imbued', 'Vampire'].some((t) => t === type);
  },
  getImageFileName: function (formattedCardName, type) {
    let imageName = this.simplifyName(formattedCardName);

    if (this.isCrypt(type)) imageName += ',cardbackcrypt';

    return imageName;
  },
  removeSpecialChars: function (name) {
    return name
      .normalize('NFD') // Convert accented words into regular ones
      .replace(/[\u0300-\u036f|\{|\}|\/]/g, '')
      .replace(/[\-|\—|\-]/g, '-')
      .replace(/[ł]/, 'l')
      .replace(/[œ]/, 'oe')
      .replace('  ', ' ');
  },
  simplifyName: function (name) {
    if (!name) return '';

    return name
      .normalize('NFD') // Convert accented words into regular ones
      .replace(/[\u0300-\u036f|\s|,|\.|\"|\'|\-|\!|\:|\(|\)|\—|\/]/g, '') // Removes unwanted special chars
      .replace(/[œ]/, 'oe') // To deal with 'Sacré-Cœeur Cathedral, France'
      .replace(/[ł]/, 'l') // To deal with 'Bolesław Gutowski'
      .toLowerCase();
  },
  generate: async function () {
    let outputLackey = `Name\tSET\tImageFile\tExpansion\tType\tClan\tGroup\tCapacity\tDiscipline\tPoolCost\tBloodCost\tText\tRarity\tArtist\n`;

    for (let filename in this.CSV_FILES) {
      const file = fs.readFileSync(this.csvPath(this.CSV_FILES[filename]), {
        encoding: 'utf8',
      });
      const csvRow = await csv().fromString(file);
      outputLackey += this.parser(csvRow);
      outputLackey += '\n';
    }

    fs.writeFileSync(this.allSetsPath(), `${outputLackey}\n`);
    console.log(`ALL SETS file created on ${this.allSetsPath()}`);
  },
  integrityCheck: function (cardLists) {
    const allSetsFile = fs.readFileSync(this.allSetsPath(), {
      encoding: 'utf8',
    });
    const lines = allSetsFile.split('\n');
    const names = lines.map((line) => this.simplifyName(line.split('\t')[0]));

    const notFound = [];

    ['crypt', 'library'].forEach((type) => {
      cardLists[type].new.every((card) => {
        const check = names.includes(
          this.simplifyName(card.Name + (card.Adv ? 'adv' : '')),
        );
        if (check) {
          return true;
        }
        notFound.push(card.Name);
      });
    });
    console.log(notFound);
  },
};
