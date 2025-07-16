require('dotenv').config();
const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
const baseProxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf8'));

const lockedProxies = new Set();

// Load credentials from .env
const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;

/**
 * Assign a locked proxy formatted like:
 * http://username:password@ip:port
 */
function getLockedProxy(userId) {
  const available = baseProxies.find(p => !lockedProxies.has(p.port));
  if (!available) return null;

  lockedProxies.add(available.port);

  const formatted = `http://${username}:${password}@${available.host}:${available.port}`;
  console.log(`🔐 Proxy locked for user ${userId}: ${formatted}`);
  return formatted;
}

function releaseLockedProxy(userId) {
  // Unlock any proxy used by the user (identified by port)
  const used = baseProxies.find(p =>
    `http://${username}:${password}@${p.host}:${p.port}`.includes(username)
    && lockedProxies.has(p.port)
  );
  if (used) {
    lockedProxies.delete(used.port);
    console.log(`🔓 Proxy released for user ${userId}: ${used.host}:${used.port}`);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
