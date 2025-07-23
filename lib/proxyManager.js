// /lib/proxyManager.js
const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
if (!fs.existsSync(proxiesPath)) {
  fs.writeFileSync(proxiesPath, JSON.stringify([]));
}

let locked = new Set();

/**
 * Load all proxies from proxies.json.
 */
function loadProxies() {
  try {
    const raw = fs.readFileSync(proxiesPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('❌ Failed to load proxies:', e.message);
    return [];
  }
}

/**
 * Lock a proxy (mark in use).
 */
function lockProxy(proxy) {
  locked.add(JSON.stringify(proxy));
}

/**
 * Release a proxy (make reusable).
 */
function releaseLockedProxy(proxy) {
  locked.delete(JSON.stringify(proxy));
}

/**
 * Get a random unlocked proxy.
 * Ensures it has host, port, user, pass.
 * Returns formatted proxy string too.
 */
async function getLockedProxy() {
  const proxies = loadProxies();
  const unlocked = proxies.filter((p) => {
    return (
      p.host &&
      p.port &&
      p.username &&
      p.password &&
      !locked.has(JSON.stringify(p))
    );
  });

  if (!unlocked.length) {
    throw new Error('No unlocked proxies available');
  }

  const selected = unlocked[Math.floor(Math.random() * unlocked.length)];
  lockProxy(selected);

  return {
    ...selected,
    formatted: `http://${selected.username}:${selected.password}@${selected.host}:${selected.port}`,
  };
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
};
