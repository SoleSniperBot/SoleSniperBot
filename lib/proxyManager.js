const fetchGeoProxies = require('./fetchGeoProxies');

let lockedProxies = new Set();

async function getLockedProxy() {
  const allProxies = await fetchGeoProxies();
  const available = allProxies.filter(p => !lockedProxies.has(p));
  if (!available.length) throw new Error('❌ No proxies left');

  const proxy = available[Math.floor(Math.random() * available.length)];
  lockedProxies.add(proxy);
  return { formatted: proxy };
}

function releaseLockedProxy(proxy) {
  if (proxy && proxy.formatted) {
    lockedProxies.delete(proxy.formatted);
  }
}

module.exports = { getLockedProxy, releaseLockedProxy };
