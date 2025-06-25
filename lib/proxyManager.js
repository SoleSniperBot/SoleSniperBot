const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');

// Load proxies JSON or empty array
let proxies = [];
try {
  if (fs.existsSync(proxiesPath)) {
    proxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf8'));
  }
} catch (err) {
  console.error('Failed to load proxies:', err.message);
}

function saveProxies() {
  fs.writeFileSync(proxiesPath, JSON.stringify(proxies, null, 2));
}

/**
 * Get a proxy locked to a user or lock a new one.
 * @param {string|number} userId
 * @returns {object|null} proxy or null if none available
 */
function getLockedProxy(userId) {
  // Find proxy already locked by this user
  let proxy = proxies.find(p => p.lockedBy === userId);
  if (proxy) return proxy;

  // Lock first free proxy for user
  proxy = proxies.find(p => !p.lockedBy);
  if (!proxy) return null;

  proxy.lockedBy = userId;
  proxy.lastUsed = Date.now();
  saveProxies();

  return proxy;
}

/**
 * Release proxy locked by user.
 * @param {string|number} userId
 * @returns {boolean} true if released, false otherwise
 */
function releaseLockedProxy(userId) {
  const proxy = proxies.find(p => p.lockedBy === userId);
  if (!proxy) return false;

  proxy.lockedBy = null;
  proxy.lastUsed = Date.now();
  saveProxies();
  return true;
}

// Stub for getUserProfiles — implement your own logic here
function getUserProfiles(userId) {
  // Example: load user profiles from file or DB
  return [];
}

// Stub for generateNikeAccount — you said you have this in another file
// If you want, you can import it or implement here
// const generateNikeAccount = require('./generateNikeAccount');

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  getUserProfiles,
  // generateNikeAccount,  // Uncomment if implemented here or imported
};
