const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
const usedProxies = new Set();

let proxies = [];
if (fs.existsSync(proxiesPath)) {
  proxies = JSON.parse(fs.readFileSync(proxiesPath));
}

function formatProxy(p) {
  return `http://${p.username}:${p.password}@${p.ip}:${p.port}`;
}

async function getLockedProxy() {
  if (!proxies.length) throw new Error('❌ No proxies available.');

  const available = proxies.find(p => !usedProxies.has(p.ip));
  if (!available) throw new Error('❌ No unused proxies available.');

  usedProxies.add(available.ip);
  return {
    ...available,
    formatted: formatProxy(available)
  };
}

async function releaseLockedProxy(proxy) {
  if (proxy?.ip && usedProxies.has(proxy.ip)) {
    usedProxies.delete(proxy.ip);
    console.log(`🔓 Released proxy: ${proxy.ip}`);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
