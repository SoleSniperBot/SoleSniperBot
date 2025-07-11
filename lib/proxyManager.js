// lib/proxyManager.js
require('dotenv').config();

const { GEONODE_USER, GEONODE_PASS, GEONODE_PORT } = process.env;
const hosts = [
  'uk1.proxy.geonode.io',
  'uk2.proxy.geonode.io',
  'uk3.proxy.geonode.io',
  'uk4.proxy.geonode.io',
  'uk5.proxy.geonode.io',
  'uk6.proxy.geonode.io',
  'uk7.proxy.geonode.io',
  'uk8.proxy.geonode.io',
  'uk9.proxy.geonode.io',
  'uk10.proxy.geonode.io'
];

let locked = new Set();

function getLockedProxy() {
  const unused = hosts.filter(host => !locked.has(host));

  if (unused.length === 0) throw new Error('❌ No unused proxies available.');

  const host = unused[Math.floor(Math.random() * unused.length)];
  locked.add(host);

  const raw = `${GEONODE_USER}:${GEONODE_PASS}@${host}:${GEONODE_PORT}`;
  const formatted = `http://${raw}`;

  return { formatted, raw };
}

function releaseLockedProxy(proxyObj) {
  const host = proxyObj?.raw?.split('@')[1]?.split(':')[0];
  if (host) locked.delete(host);
}

module.exports = { getLockedProxy, releaseLockedProxy };
