// lib/proxyManager.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const proxyFile = path.join(__dirname, '../data/proxies_extended.json');
let lockedProxies = new Set();
let lastUsed = null;

function loadProxies() {
  if (!fs.existsSync(proxyFile)) return [];
  const baseList = JSON.parse(fs.readFileSync(proxyFile));
  return baseList.map(p => ({
    host: p.host,
    port: p.port,
    formatted: `http://${process.env.GEONODE_USER}:${process.env.GEONODE_PASS}@${p.host}:${p.port}`
  }));
}

const proxyPool = loadProxies();

async function getLockedProxy() {
  const available = proxyPool.filter(p => !lockedProxies.has(p.formatted));
  if (available.length === 0) throw new Error('❌ No proxies left to assign.');

  let selected;
  let attempts = 0;
  do {
    selected = available[Math.floor(Math.random() * available.length)];
    attempts++;
  } while (selected.formatted === lastUsed && attempts < 10);

  lockedProxies.add(selected.formatted);
  lastUsed = selected.formatted;
  console.log(`🔐 Locked Proxy → ${selected.formatted}`);
  return selected;
}

async function releaseLockedProxy(proxy) {
  if (proxy?.formatted) {
    lockedProxies.delete(proxy.formatted);
    console.log(`🔓 Released Proxy → ${proxy.formatted}`);
  }
}

module.exports = { getLockedProxy, releaseLockedProxy };
