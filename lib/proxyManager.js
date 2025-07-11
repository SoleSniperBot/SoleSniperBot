const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/proxies.json');
const proxies = JSON.parse(fs.readFileSync(proxyPath, 'utf-8'));

const lockedProxies = new Set();

function getRandomProxy() {
  const available = proxies.filter((p) => !lockedProxies.has(`${p.host}:${p.port}`));
  if (available.length === 0) return null;

  const selected = available[Math.floor(Math.random() * available.length)];
  const id = `${selected.host}:${selected.port}`;
  lockedProxies.add(id);

  const username = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;

  return {
    host: selected.host,
    port: selected.port,
    id,
    formatted: `http://${username}:${password}@${selected.host}:${selected.port}`
  };
}

async function getLockedProxy() {
  const proxy = getRandomProxy();
  if (!proxy) throw new Error('No proxies available or all are locked');
  return proxy;
}

async function releaseLockedProxy(proxy) {
  if (proxy?.id) lockedProxies.delete(proxy.id);
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
