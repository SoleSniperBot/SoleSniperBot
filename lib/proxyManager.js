// lib/proxyManager.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const proxyPath = path.join(__dirname, '../data/socks5_proxies.json');
const lockedProxies = new Set();

function parseProxies() {
  if (!fs.existsSync(proxyPath)) return [];

  const raw = fs.readFileSync(proxyPath, 'utf8');
  try {
    return JSON.parse(raw).filter(p => p && p.startsWith('socks5://'));
  } catch {
    return [];
  }
}

async function fetchGeoNodeProxies() {
  const apiKey = process.env.GEONODE_API_KEY;
  const url = `https://proxy.geonode.com/api/proxy-list?limit=50&page=1&type=socks5&provider=geonode&country=gb&speed=fast&api_key=${apiKey}`;

  const res = await axios.get(url);
  const proxies = res.data?.data || [];

  const formatted = proxies.map(p => {
    const auth = `${p.username}:${p.password}`;
    return `socks5://${auth}@${p.ip}:${p.port}`;
  });

  if (formatted.length > 0) {
    fs.writeFileSync(proxyPath, JSON.stringify(formatted, null, 2));
  }

  return formatted;
}

async function getLockedProxy() {
  let proxies = parseProxies();

  if (proxies.length === 0) {
    proxies = await fetchGeoNodeProxies();
  }

  for (const proxy of proxies) {
    if (!lockedProxies.has(proxy)) {
      lockedProxies.add(proxy);
      return { formatted: proxy };
    }
  }

  throw new Error('No available proxies');
}

function releaseLockedProxy(proxy) {
  if (proxy?.formatted) {
    lockedProxies.delete(proxy.formatted);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
};
