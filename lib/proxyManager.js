const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

const proxiesPath = path.join(__dirname, '../data/socks5_proxies.json');
let proxyList = [];
let lockedProxies = new Set();

// Load proxies from JSON file
function loadProxies() {
  if (!fs.existsSync(proxiesPath)) {
    console.warn('⚠️ No socks5_proxies.json found.');
    return;
  }

  try {
    const raw = fs.readFileSync(proxiesPath);
    proxyList = JSON.parse(raw);
    console.log(`🔌 Loaded ${proxyList.length} proxies`);
  } catch (e) {
    console.error('❌ Failed to parse socks5_proxies.json:', e.message);
  }
}

// Call once on startup
loadProxies();

// Function to validate a proxy by visiting Nike UK
async function isProxyWorking(proxyUrl) {
  const agent = new SocksProxyAgent(proxyUrl);

  try {
    const res = await axios.get('https://www.nike.com/gb', {
      httpsAgent: agent,
      timeout: 10000,
      headers: {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    return res.status === 200 && res.data.includes('Nike');
  } catch (err) {
    console.warn(`❌ Proxy failed: ${proxyUrl} — ${err.message}`);
    return false;
  }
}

// Select and lock a random valid proxy
async function getLockedProxy() {
  const available = proxyList.filter(p => !lockedProxies.has(p));
  if (available.length === 0) {
    console.warn('⚠️ No available proxies to lock');
    return null;
  }

  for (let proxy of available) {
    const isValid = await isProxyWorking(proxy);
    if (isValid) {
      lockedProxies.add(proxy);
      console.log(`🔐 Locked working proxy: ${proxy}`);
      return {
        formatted: proxy,
        release: () => releaseLockedProxy({ formatted: proxy })
      };
    }
  }

  console.warn('❌ All proxies are invalid or blocked by Nike.');
  return null;
}

// Release a locked proxy
async function releaseLockedProxy(proxy) {
  if (proxy?.formatted && lockedProxies.has(proxy.formatted)) {
    lockedProxies.delete(proxy.formatted);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
