require('dotenv').config();
const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
const baseProxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf8'));

// Load credentials from .env
const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;

// Track which user is using which proxy (userId → port)
const proxyLocks = new Map();

/**
 * Assign a locked proxy to a user formatted like:
 * http://username:password@ip:port
 */
function getLockedProxy(userId) {
  if (proxyLocks.has(userId)) {
    // Return existing proxy if user already has one
    const existing = baseProxies.find(p => p.port === proxyLocks.get(userId));
    return `http://${username}:${password}@${existing.host}:${existing.port}`;
  }

  // Find an unused proxy
  const available = baseProxies.find(p => ![...proxyLocks.values()].includes(p.port));
  if (!available) return null;

  proxyLocks.set(userId, available.port);
  const formatted = `http://${username}:${password}@${available.host}:${available.port}`;
  console.log(`🔐 Proxy locked for user ${userId}: ${formatted}`);
  return formatted;
}

function releaseLockedProxy(userId) {
  if (proxyLocks.has(userId)) {
    const port = proxyLocks.get(userId);
    proxyLocks.delete(userId);
    const released = baseProxies.find(p => p.port === port);
    console.log(`🔓 Proxy released for user ${userId}: ${released.host}:${released.port}`);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
