const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/proxies.json');
let proxies = fs.existsSync(proxyPath) ? JSON.parse(fs.readFileSync(proxyPath)) : [];

// Format: { userId: [proxy1, proxy2, ...] }
let userProxies = {};
let lockedProxies = {}; // Format: { accountEmail: proxy }

function saveProxies() {
  fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
}

// 🔐 Lock a proxy to a specific account email (not just userId)
function lockRandomProxy(accountEmail) {
  if (lockedProxies[accountEmail]) return lockedProxies[accountEmail]; // Already locked

  const available = proxies.filter(p => !Object.values(lockedProxies).includes(p));
  if (available.length === 0) return null;

  const proxy = available[Math.floor(Math.random() * available.length)];
  lockedProxies[accountEmail] = proxy;
  return proxy;
}

function releaseLockedProxy(accountEmail) {
  delete lockedProxies[accountEmail];
}

function getLockedProxy(accountEmail) {
  return lockedProxies[accountEmail] || null;
}

function getUserProxies(userId) {
  return userProxies[userId] || [];
}

function addUserProxies(userId, proxyList) {
  if (!userProxies[userId]) userProxies[userId] = [];
  userProxies[userId].push(...proxyList);

  // Optionally merge to global proxy pool too:
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
