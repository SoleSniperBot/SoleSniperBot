// lib/proxyManager.js
const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/socks5_proxies.json');
const locks = {};

function loadProxies() {
  const data = fs.readFileSync(proxyPath, 'utf-8');
  const proxies = JSON.parse(data);
  return proxies;
}

function getFormattedProxy(proxy) {
  const { host, port, username, password } = proxy;
  return `socks5://${username}:${password}@${host}:${port}`;
}

async function getLockedProxy() {
  const proxies = loadProxies();
  for (const proxy of proxies) {
    const id = `${proxy.host}:${proxy.port}`;
    if (!locks[id]) {
      locks[id] = true;
      return {
        ...proxy,
        formatted: getFormattedProxy(proxy),
        id
      };
    }
  }
  throw new Error('No available proxies');
}

async function releaseLockedProxy(proxy) {
  if (proxy?.id) delete locks[proxy.id];
}

module.exports = { getLockedProxy, releaseLockedProxy };
