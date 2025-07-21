const { HttpsProxyAgent } = require('https-proxy-agent');

const username = 'geonode_fUy6U0SwyY-type-residential';
const password = 'de9d3498-2b19-429e-922b-8f2a24eeb83c';

function formatProxy(proxyObj) {
  const auth = `${username}:${password}`;
  const host = proxyObj.host;
  const port = proxyObj.port;
  return `http://${auth}@${host}:${port}`;
}

function getAgent(proxyObj) {
  return new HttpsProxyAgent({
    protocol: 'http:',
    host: proxyObj.host,
    port: proxyObj.port,
    auth: `${username}:${password}`
  });
}
