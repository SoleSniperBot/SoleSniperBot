const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
const locksPath = path.join(__dirname, '../data/proxyLocks.json');

// Load proxies
function loadProxies() {
  if (!fs.existsSync(proxiesPath)) return [];
  const raw = fs.readFileSync(proxiesPath);
  return JSON.parse(raw);
}

// Load current locks
function loadLocks() {
  if (!fs.existsSync(locksPath)) fs.writeFileSync(locksPath, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(locksPath));
}

// Save locks
function saveLocks(locks) {
  fs.writeFileSync(locksPath, JSON.stringify(locks, null, 2));
}

// Get an available proxy and lock it
async function getLockedProxy(userId) {
  const proxies = loadProxies();
  const locks = loadLocks();

  for (const proxy of proxies) {
    const key = `${proxy.host}:${proxy.port}`;
    const lockedBy = locks[key];

    // Skip if in use
    if (lockedBy && lockedBy.userId && lockedBy.userId !== userId) continue;

    // Lock and return
    locks[key] = {
      userId,
      timestamp: Date.now()
    };
    saveLocks(locks);
    return proxy;
  }

  return null;
}

// Release proxy after use
async function releaseLockedProxy(userId, proxy) {
  const locks = loadLocks();
  const key = `${proxy.host}:${proxy.port}`;
  if (locks[key]?.userId === userId) {
    delete locks[key];
    saveLocks(locks);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
