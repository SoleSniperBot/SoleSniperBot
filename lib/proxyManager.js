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
  if (lockedProxies.has(userId)) {
    return lockedProxies.get(userId);
  }
  if (proxies.length === 0) {
    loadProxies();
  }
  if (proxies.length === 0) return null;

  const proxy = proxies[Math.floor(Math.random() * proxies.length)];
  lockedProxies.set(userId, proxy);
  return proxy;
}

function releaseLockedProxy(userId) {
  lockedProxies.delete(userId);
}

function addUserProxies(userId, newProxies) {
  // Append new proxies, save to disk
  proxies.push(...newProxies);
  // Remove duplicates
  proxies = [...new Set(proxies)];
  fs.writeFileSync(proxyFile, JSON.stringify(proxies, null, 2));
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  addUserProxies,
  loadProxies,
};
