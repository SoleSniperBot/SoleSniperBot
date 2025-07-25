const fs = require('fs');
const path = require('path');

const PROXY_COUNT = 50;
const host = 'proxy.geonode.io';
const basePort = 12000;

const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;

const proxiesPath = path.join(__dirname, '../data/socks5_proxies.json');
let proxyList = [];
let lockedProxies = new Set();

// Build default list dynamically from env
function buildFallbackProxies() {
  const fallback = [];
  for (let i = 0; i < PROXY_COUNT; i++) {
    fallback.push(`socks5://${username}:${password}@${host}:${basePort + i}`);
  }
  return fallback;
}

function loadProxies() {
  if (!fs.existsSync(proxiesPath)) {
    console.warn('⚠️ No socks5_proxies.json found. Generating dynamically...');
    proxyList = buildFallbackProxies();
    return;
  }

  try {
    const raw = fs.readFileSync(proxiesPath);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn('⚠️ Proxy file empty or invalid. Using fallback list.');
      proxyList = buildFallbackProxies();
    } else {
      proxyList = parsed;
    }
    console.log(`🔌 Loaded ${proxyList.length} proxies`);
  } catch (e) {
    console.error('❌ Failed to parse socks5_proxies.json:', e.message);
    proxyList = buildFallbackProxies();
  }
}

// Call once on startup
loadProxies();

function getRandomFreeProxy() {
  const available = proxyList.filter(p => !lockedProxies.has(p));
  if (available.length === 0) return null;

  const selected = available[Math.floor(Math.random() * available.length)];
  lockedProxies.add(selected);
  return selected;
}

async function getLockedProxy() {
  const proxy = getRandomFreeProxy();
  if (!proxy) {
    console.warn('⚠️ No available proxies to lock');
    return null;
  }

  return {
    formatted: proxy,
    release: () => releaseLockedProxy({ formatted: proxy })
  };
}

async function releaseLockedProxy(proxy) {
  if (proxy?.formatted && lockedProxies.has(proxy.formatted)) {
    lockedProxies.delete(proxy.formatted);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
