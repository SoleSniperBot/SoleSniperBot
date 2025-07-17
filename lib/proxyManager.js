const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/proxies.json');

// Load proxies from disk
let rawProxies = fs.existsSync(proxyPath)
  ? JSON.parse(fs.readFileSync(proxyPath))
  : [];

// Active lock tracker
const lockedProxies = new Set();

/**
 * Get a free proxy and lock it to user ID
 */
function getLockedProxy(userId) {
  for (let proxy of rawProxies) {
    const key = `${proxy.host}:${proxy.port}`;
    if (!lockedProxies.has(key)) {
      lockedProxies.add(key);

      const formatted = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      return {
        proxy,
        formatted,
        user: userId,
      };
    }
  }

  return null; // No available proxies
}

/**
 * Release a locked proxy so it can be reused
 */
function releaseLockedProxy(proxy) {
  if (!proxy || !proxy.host || !proxy.port) return;

  const key = `${proxy.host}:${proxy.port}`;
  if (lockedProxies.has(key)) {
    lockedProxies.delete(key);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
};
