const fs = require('fs');
const path = require('path');

const getUserProxyPath = (userId) =>
  path.join(__dirname, `./data/proxies_user_${userId}.json`);

function getLockedProxy(userId) {
  const proxyPath = getUserProxyPath(userId);
  if (!fs.existsSync(proxyPath)) return null;

  const proxyList = JSON.parse(fs.readFileSync(proxyPath, 'utf8'));

  const freeProxy = proxyList.find(p => !p.locked);
  if (!freeProxy) return null;

  freeProxy.locked = true;
  freeProxy.lastUsed = new Date().toISOString();

  fs.writeFileSync(proxyPath, JSON.stringify(proxyList, null, 2));
  return { ip: freeProxy.ip };
}

function releaseLockedProxy(userId, ip) {
  const proxyPath = getUserProxyPath(userId);
  if (!fs.existsSync(proxyPath)) return false;

  const proxyList = JSON.parse(fs.readFileSync(proxyPath, 'utf8'));
  const target = proxyList.find(p => p.ip === ip);
  if (!target) return false;

  target.locked = false;
  fs.writeFileSync(proxyPath, JSON.stringify(proxyList, null, 2));
  return true;
}

function getAllUserProxies(userId) {
  const proxyPath = getUserProxyPath(userId);
  if (!fs.existsSync(proxyPath)) return [];
  return JSON.parse(fs.readFileSync(proxyPath, 'utf8'));
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  getAllUserProxies
};
