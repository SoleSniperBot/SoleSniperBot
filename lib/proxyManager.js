const fs = require('fs');
const path = require('path');

const proxies = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/proxies.json')));
let lastUsed = null;

function getRandomProxy() {
  if (proxies.length === 0) {
    throw new Error('❌ No proxies available.');
  }

  let selected;
  let attempts = 0;

  do {
    selected = proxies[Math.floor(Math.random() * proxies.length)];
    attempts++;
  } while (selected === lastUsed && attempts < 10); // avoid recent repeat

  lastUsed = selected;

  console.log(`🔄 Proxy in use: ${selected}`);
  return selected;
}

module.exports = { getRandomProxy };
