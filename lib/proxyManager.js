const fs = require('fs');
const path = require('path');

const proxyFile = path.join(__dirname, '../data/proxies.json');

let proxies = [];
let lockedProxies = new Map(); // userId => proxy string

function loadProxies() {
  if (fs.existsSync(proxyFile)) {
    proxies = JSON.parse(fs.readFileSync(proxyFile, 'utf8'));
  }
}

function getLockedProxy(userId) {
  // Return existing locked proxy for user
  if (lockedProxies.has(userId)) {
    return lockedProxies.get(userId);
  }
  if (proxies.length === 0) {
    loadProxies();
  }
  if (proxies.length === 0) return null;

  // Choose random proxy not already locked by someone else
  const availableProxies = proxies.filter(p => ![...lockedProxies.values()].includes(p));
  if (availableProxies.length === 0) return null;

  const proxy = availableProxies[Math.floor(Math.random() * availableProxies.length)];
  lockedProxies.set(userId, proxy);
  return proxy;
}

function releaseLockedProxy(userId) {
  lockedProxies.delete(userId);
}

function addUserProxies(userId, newProxies) {
  // Remove duplicates globally
  proxies = [...new Set([...proxies, ...newProxies])];
  fs.writeFileSync(proxyFile, JSON.stringify(proxies, null, 2));
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  addUserProxies,
  loadProxies,
};
