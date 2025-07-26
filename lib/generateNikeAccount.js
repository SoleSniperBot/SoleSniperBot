// lib/proxyManager.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Geonode credentials
const user = process.env.GEONODE_USER;
const pass = process.env.GEONODE_PASS;
const host = process.env.GEONODE_HOST || '92.204.164.15';
const port = Number(process.env.GEONODE_PORT) || 12000;

const PROXY_JSON = path.join(__dirname, '../data/socks5_proxies.json');
let proxyList = [];
let locked = new Set();

function loadProxies() {
  if (fs.existsSync(PROXY_JSON)) {
    try {
      proxyList = JSON.parse(fs.readFileSync(PROXY_JSON));
      console.log(`🔌 Loaded ${proxyList.length} proxies from JSON`);
      return;
    } catch (e) {
      console.error('❌ socks5_proxies.json parse error:', e.message);
    }
  }
  proxyList = [];
  if (user && pass && host && port) {
    for (let i = 0; i < 50; i++) {
      const sessionId = Math.random().toString(36).slice(2, 8);
      const uname = `${user}-session-${sessionId}`;
      proxyList.push({
        host,
        port,
        username: uname,
        password: pass,
        formatted: `socks5://${uname}:${pass}@${host}:${port}`
      });
    }
    console.log(`✅ Dynamically generated ${proxyList.length} GeoNode proxies`);
  } else {
    console.warn('⚠️ No JSON file and missing ENV for dynamic proxies');
  }
}

function pickProxy() {
  const free = proxyList.filter(p => !locked.has(p.formatted));
  if (!free.length) return null;
  const p = free[Math.floor(Math.random() * free.length)];
  locked.add(p.formatted);
  return p;
}

async function getLockedProxy() {
  const p = pickProxy();
  if (!p) {
    console.warn('⚠️ No available proxy');
    return null;
  }
  return {
    formatted: p.formatted,
    host: p.host,
    port: p.port,
    username: p.username,
    password: p.password
  };
}

async function releaseLockedProxy(proxyObj) {
  if (proxyObj?.formatted) locked.delete(proxyObj.formatted);
}

loadProxies();

module.exports = { getLockedProxy, releaseLockedProxy };
