const fs = require('fs');
const path = require('path');

const USER = process.env.GEONODE_USER;
const PASS = process.env.GEONODE_PASS;
const HOST = 'proxy.geonode.io';

const proxiesPath = path.join(__dirname, '../data/proxies.json');
let allProxies = JSON.parse(fs.readFileSync(proxiesPath));

let lockedProxies = {};

function getLockedProxy() {
  const available = allProxies.filter(p => !lockedProxies[p.port]);

  if (available.length === 0) return null;

  const selected = available[Math.floor(Math.random() * available.length)];
  lockedProxies[selected.port] = true;

  return {
    ...selected,
    formatted: `http://${USER}:${PASS}@${HOST}:${selected.port}`
  };
}

function releaseLockedProxy(proxy) {
  if (proxy?.port) delete lockedProxies[proxy.port];
}

module.exports = { getLockedProxy, releaseLockedProxy };
