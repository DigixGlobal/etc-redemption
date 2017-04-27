const fs = require('fs');

const scriptsDir = './scripts/data';

const toBlock = parseInt(process.argv[process.argv.length - 1], 10);
if (!toBlock) { throw new Error('Must pass a block number'); }

function getData(name) {
  const parsed = JSON.parse(fs.readFileSync(`${scriptsDir}/${name}`));
  const type = parsed.balances ? 'default' : 'etherscan';
  const data = type === 'default' ?
    Object.keys(parsed.balances).reduce((o, key) => {
      const { dgd, unclaimedDgdWei, combined } = parsed.balances[key];
      return Object.assign({}, o, { [key]: { dgd: parseFloat(dgd, 10), unclaimedDgdWei, combined } });
    }, {})
  :
    Object.keys(parsed.items).reduce((o, key) => {
      const dgd = parsed.items[key];
      return Object.assign({}, o, { [key]: { dgd } });
    }, {});
  return { name, type, data };
}

function validateData(dataSet) {
  const validationIssues = {};
  // add last to the first
  const validated = dataSet.filter(({ data, name, type }, i) => {
    const prev = dataSet[i === 0 ? dataSet.length - 1 : i - 1];
    const keys = new Set();
    Object.keys(prev.data).forEach(k => keys.add(k));
    Object.keys(data).forEach(k => keys.add(k));
    let pass = true;
    keys.forEach((key) => {
      let fail = '';
      // only show error if it's not etherscan, as etherscan doesnt pick up everything
      if (type !== 'etherscan' && !data[key]) {
        fail += `missing ${key}`;
      }
      if (data[key] && prev.data[key]) {
        if (data[key].dgd !== prev.data[key].dgd) {
          fail += `dgd ${data[key].dgd} !== ${prev.data[key].dgd} `;
        }
        // again, only compare non-etherscan links
        if (type !== 'etherscan' && prev.type !== 'etherscan') {
          if (data[key].unclaimedDgdWei !== prev.data[key].unclaimedDgdWei) {
            fail += `unclaimed ${data[key].unclaimedDgdWei} !== ${prev.data[key].unclaimedDgdWei} `;
          }
          if (data[key].combined !== prev.data[key].combined) {
            fail += `combined ${data[key].combined} !== ${prev.data[key].combined} `;
          }
        }
      }
      if (fail) {
        if (!validationIssues[key]) { validationIssues[key] = {}; }
        validationIssues[key][name] = fail;
        pass = false;
      }
      return null;
    });
    return pass;
  });
  return { validated, validationIssues };
}

(function () {
  const filenames = fs.readdirSync(scriptsDir).filter(a => a.indexOf(`balances-${toBlock}-`) === 0);
  process.stdout.write(`
    comparing ${filenames.length} reports
    ${filenames.join('\n    ')}
`);
  const dataSet = filenames.map(name => getData(name));
  const { validated, validationIssues } = validateData(dataSet);
  if (Object.keys(validationIssues).length === 0) {
    process.stdout.write(`
    ✅  Success! ${validated.length} reports are valid
`);
  } else {
    process.stdout.write(`
    ⛔️  Failure! reports are NOT all identical

    Validation Issues:
${JSON.stringify(validationIssues, null, 2)}
`);
  }
}());
