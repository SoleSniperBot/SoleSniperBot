const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
const lockedPath = path.join(__dirname, '../data/lockedProxies.json');

if (!fs.existsSync(proxiesPath)) fs.writeFileSync(proxiesPath, JSON.stringify([]));
if (!fs.existsSync(lockedPath)) fs.writeFileSync(lockedPath, JSON.stringify([]));

function getAllProxies() {
  return JSON.parse(fs.readFileSync(proxiesPath));
}

function getLocked() {
  return JSON.parse(fs.readFileSync(lockedPath));
}

function saveLocked(locked) {
  fs.writeFileSync(lockedPath, JSON.stringify(locked, null, 2));
}

async function getLockedProxy() {
  const all = getAllProxies();
  const locked = getLocked();

  console.log(`📦 Found ${all.length} proxies, ${locked.length} locked`);

  for (const proxy of all) {
    if (!proxy.formatted) {
      console.log('❌ Skipping: missing "formatted" field', proxy);
      continue;
    }

    const id = proxy.formatted;

    if (!locked.includes(id)) {
      locked.push(id);
      saveLocked(locked);
      console.log('🔐 Using proxy:', id);
      return proxy;
    }
  }

  console.log('❌ No usable proxies found — all locked or invalid');
  return null;
}

async function releaseLockedProxy(proxy) {
  const locked = getLocked();
  const id = proxy.formatted;
  const index = locked.indexOf(id);
  if (index !== -1) {
    locked.splice(index, 1);
    saveLocked(locked);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
