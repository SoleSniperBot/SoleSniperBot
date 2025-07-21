const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
const locksPath = path.join(__dirname, '../data/proxyLocks.json');

// Ensure data files exist
if (!fs.existsSync(proxiesPath)) {
  fs.writeFileSync(proxiesPath, JSON.stringify([]));
}

if (!fs.existsSync(locksPath)) {
  fs.writeFileSync(locksPath, JSON.stringify({}));
}

// Load current state
function loadProxies() {
  return JSON.parse(fs.readFileSync(proxiesPath));
}

function loadLocks() {
  return JSON.parse(fs.readFileSync(locksPath));
}

function saveLocks(locks) {
  fs.writeFileSync(locksPath, JSON.stringify(locks, null, 2));
}

// Lock a proxy for a specific user
async function getLockedProxy(userId = 'system') {
  const proxies = loadProxies();
  const locks = loadLocks();

  // Find first available (unlocked) proxy
  for (let proxy of proxies) {
    const key = `${proxy.host}:${proxy.port}`;
    if (!locks[key]) {
      // Lock it to user
      locks[key] = userId;
      saveLocks(locks);

      const { host, port, username, password } = proxy;

      const formatted = username && password
        ? `http://${username}:${password}@${host}:${port}`
        : `http://${host}:${port}`;

      return {
        host,
        port,
        username,
        password,
        formatted
      };
    }
  }

  throw new Error('No proxies left or all used.');
}

// Release proxy after task
async function releaseLockedProxy(userId = 'system') {
  const locks = loadLocks();
  let released = false;

  for (const key in locks) {
    if (locks[key] === userId) {
      delete locks[key];
      released = true;
    }
  }

  if (released) {
    saveLocks(locks);
  }
}

// Manual reset (admin use only)
function resetProxyLocks() {
  fs.writeFileSync(locksPath, JSON.stringify({}));
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  resetProxyLocks
};
