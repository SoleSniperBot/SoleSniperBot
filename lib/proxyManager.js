const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/proxies.json');
const lockedProxies = new Set();

// Load IPs and ports only (from your JSON format)
const baseProxies = fs.existsSync(proxyPath)
  ? JSON.parse(fs.readFileSync(proxyPath))
  : [];

// Your secrets (set these in Railway's environment variables)
const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;

/**
 * Format full authenticated proxy string
 */
function formatProxy(proxy) {
  if (!proxy || !username || !password) return null;
  return `http://${username}:${password}@${proxy.host}:${proxy.port}`;
}

/**
 * Lock a free proxy
 */
function getLockedProxy(userId) {
  for (let proxy of baseProxies) {
    const key = `${proxy.host}:${proxy.port}`;
    if (!lockedProxies.has(key)) {
      lockedProxies.add(key);

      return {
        proxy, // { host, port }
        formatted: formatProxy(proxy), // http://user:pass@host:port
        user: userId
      };
    }
  }
  return null;
}

/**
 * Release it back into the pool
 */
function releaseLockedProxy(proxy) {
  if (!proxy || !proxy.host || !proxy.port) return;
  const key = `${proxy.host}:${proxy.port}`;
  lockedProxies.delete(key);
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
