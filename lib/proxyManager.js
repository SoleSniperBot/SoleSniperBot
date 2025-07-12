require('dotenv').config();
const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
const baseProxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf8'));

// Keep track of locked proxies
const locked = new Set();

// Load credentials from .env
const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;

function getLockedProxy() {
  const available = baseProxies.find(p => !locked.has(p.port));
  if (!available) throw new Error('❌ No proxies left to assign.');

  locked.add(available.port);

  const formatted = `http://${username}:${password}@${available.host}:${available.port}`;
  return {
    ...available,
    formatted
  };
}

function releaseLockedProxy(proxy) {
  if (proxy?.port) locked.delete(proxy.port);
}

module.exports = { getLockedProxy, releaseLockedProxy };
