const used = new Set();
const maxProxies = 50;

const user = process.env.GEONODE_USER;
const pass = process.env.GEONODE_PASS;
const host = process.env.GEONODE_HOST || 'proxy.geonode.io';
const port = process.env.GEONODE_PORT || '9000';

const proxies = Array.from({ length: maxProxies }).map((_, i) => ({
  id: i,
  formatted: `http://${user}:${pass}@${host}:${port}`
}));

async function getLockedProxy(userId = 'default') {
  for (const proxy of proxies) {
    if (!used.has(proxy.id)) {
      used.add(proxy.id);
      return proxy;
    }
  }
  throw new Error('No proxies left to assign.');
}

async function releaseLockedProxy(userId = 'default') {
  for (const proxy of proxies) {
    if (used.has(proxy.id)) {
      used.delete(proxy.id);
      break;
    }
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
