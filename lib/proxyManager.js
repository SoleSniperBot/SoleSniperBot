require('dotenv').config();
const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
const baseProxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf8'));

const locked = new Set();

const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;

function getLockedProxy(userId) {
  const available = baseProxies.find(p => !locked.has(p.port));
  if (!available) throw new Error('❌ No proxies left to assign.');

  locked.add(available.port);

  const formatted = `http://${username}:${password}@${available.host}:${available.port}`;
  return formatted;
}

function releaseLockedProxy(userId) {
  // This just releases any proxy locked by port
  // In future you can track per-user if needed
  for (const p of baseProxies) {
    if (locked.has(p.port)) {
      locked.delete(p.port);
      break;
    }
  }
}

module.exports = { getLockedProxy, releaseLockedProxy };
