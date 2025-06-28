const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/proxies.json');
let proxies = fs.existsSync(proxyPath) ? JSON.parse(fs.readFileSync(proxyPath)) : [];
let lockedProxies = {}; // { userId: proxy }

function saveProxies() {
  fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
}

function lockRandomProxy(userId) {
  if (lockedProxies[userId]) return lockedProxies[userId]; // Already locked

  const available = proxies.filter(p => !Object.values(lockedProxies).includes(p));
  if (available.length === 0) return null;

  const proxy = available[Math.floor(Math.random() * available.length)];
  lockedProxies[userId] = proxy;
  return proxy;
}

function releaseLockedProxy(userId) {
  delete lockedProxies[userId];
}

function getLockedProxy(userId) {
  return lockedProxies[userId] || null;
}

function getUserProxies(userId) {
  return proxies.filter(p => lockedProxies[userId] === p);
}

function addUserProxies(userId, proxyList) {
  proxies.push(...proxyList);
  saveProxies();
}

module.exports = {
  lockRandomProxy,
  releaseLockedProxy,
  getLockedProxy,
  getUserProxies,
  addUserProxies
};
