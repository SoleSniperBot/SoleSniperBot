const fs = require('fs');
const path = require('path');

const proxyFile = path.join(__dirname, '../data/proxies.json');

function getUserProxies(userId) {
  if (!fs.existsSync(proxyFile)) return [];
  const data = JSON.parse(fs.readFileSync(proxyFile));
  return data[userId] || [];
}

function getLockedProxy(userId, accountEmail) {
  const allProxies = getUserProxies(userId);
  const lockKey = `${userId}_${accountEmail}`;
  const lockFile = path.join(__dirname, '../data/lockedProxies.json');

  let locks = {};
  if (fs.existsSync(lockFile)) {
    locks = JSON.parse(fs.readFileSync(lockFile));
  }

  if (locks[lockKey]) return locks[lockKey];

  const unused = allProxies.find(p => !Object.values(locks).includes(p));
  if (!unused) return null;

  locks[lockKey] = unused;
  fs.writeFileSync(lockFile, JSON.stringify(locks, null, 2));
  return unused;
}

function releaseLockedProxy(userId, accountEmail) {
  const lockKey = `${userId}_${accountEmail}`;
  const lockFile = path.join(__dirname, '../data/lockedProxies.json');
  if (!fs.existsSync(lockFile)) return;

  const locks = JSON.parse(fs.readFileSync(lockFile));
  delete locks[lockKey];
  fs.writeFileSync(lockFile, JSON.stringify(locks, null, 2));
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
