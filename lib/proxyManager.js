const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '../data/proxies.json'));
const proxyList = JSON.parse(raw);

let lastUsed = null;

function getLockedProxy() {
  if (!proxyList.length) throw new Error('❌ No proxies available.');

  let selected;
  let attempts = 0;

  do {
    selected = proxyList[Math.floor(Math.random() * proxyList.length)];
    attempts++;
  } while (
    lastUsed && selected.ip === lastUsed.ip && selected.port === lastUsed.port && attempts < 10
  );

  lastUsed = selected;

  const formatted = `http://${process.env.GEONODE_USER}:${process.env.GEONODE_PASS}@${selected.ip}:${selected.port}`;

  return {
    ...selected,
    username: process.env.GEONODE_USER,
    password: process.env.GEONODE_PASS,
    formatted
  };
}

async function releaseLockedProxy(proxy) {
  // Placeholder for future logic (e.g., proxy cooldown or tracking)
  console.log(`🔓 Released proxy: ${proxy.ip}`);
}

module.exports = { getLockedProxy, releaseLockedProxy };
