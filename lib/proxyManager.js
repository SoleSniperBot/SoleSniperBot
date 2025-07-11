require('dotenv').config();

const proxies = process.env.PROXY_LIST?.split(',') || [];
let lastUsed = null;

function getLockedProxy() {
  if (!proxies.length) throw new Error('❌ No proxies in environment');

  let selected;
  let attempts = 0;

  do {
    selected = proxies[Math.floor(Math.random() * proxies.length)];
    attempts++;
  } while (selected === lastUsed && attempts < 10);

  lastUsed = selected;

  return { formatted: selected };
}

function releaseLockedProxy(proxy) {
  // Optional: You can log or reuse later
  console.log(`🔓 Released proxy: ${proxy.formatted}`);
}

module.exports = { getLockedProxy, releaseLockedProxy };
