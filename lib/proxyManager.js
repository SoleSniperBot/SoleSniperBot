const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/socks5_proxies.json');

let rawProxies = [];
if (fs.existsSync(proxyPath)) {
  rawProxies = JSON.parse(fs.readFileSync(proxyPath, 'utf-8'));
}

const parsedProxies = rawProxies.map((entry) => {
  const [host, port, username, password] = entry.split(':');
  return {
    host,
    port: parseInt(port),
    username,
    password,
    formatted: `socks5://${username}:${password}@${host}:${port}`,
    locked: false // used to prevent re-use during async tasks
  };
});

// 🔐 Proxy locking logic
function getLockedProxy() {
  const available = parsedProxies.find(p => !p.locked);
  if (!available) throw new Error('No available proxies');
  available.locked = true;
  return available;
}

function releaseLockedProxy(proxy) {
  const match = parsedProxies.find(p =>
    p.host === proxy.host &&
    p.port === proxy.port &&
    p.username === proxy.username
  );
  if (match) match.locked = false;
}

function getAllProxies() {
  return parsedProxies;
}

function getRandomProxy() {
  const unlocked = parsedProxies.filter(p => !p.locked);
  if (unlocked.length === 0) throw new Error('No unlocked proxies');
  const proxy = unlocked[Math.floor(Math.random() * unlocked.length)];
  proxy.locked = true;
  return proxy;
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  getAllProxies,
  getRandomProxy
};
