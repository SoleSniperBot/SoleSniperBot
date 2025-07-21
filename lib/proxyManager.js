const proxies = require('../data/proxies.json');
const used = new Set();

function getLockedProxy(userId = 'system') {
  for (const proxy of proxies) {
    const id = `${proxy.host}:${proxy.port}`;
    if (!used.has(id)) {
      used.add(id);
      return {
        ...proxy,
        formatted: `http://geonode_fUy6U0SwyY-type-residential:de9d3498-2b19-429e-922b-8f2a24eeb83c@${proxy.host}:${proxy.port}`
      };
    }
  }
  throw new Error('No available proxies');
}

function releaseLockedProxy(userId = 'system') {
  used.clear(); // basic release logic, expand if needed
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
