// lib/fetchGeoProxies.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dns = require('dns').promises;

module.exports = async function fetchGeoProxies(amount = 50) {
  const domain = process.env.GEONODE_HOST || 'proxy.geonode.io';
  const basePort = 12000;
  const maxPort = 12010;
  const baseUsername = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;

  // Resolve domain to IP
  let ip;
  try {
    const res = await dns.lookup(domain);
    ip = res.address;
    console.log(`🌐 Resolved ${domain} → ${ip}`);
  } catch (err) {
    console.error('❌ DNS resolution failed for GeoNode host:', err.message);
    return [];
  }

  const proxies = [];

  for (let i = 0; i < amount; i++) {
    const sessionId = crypto.randomBytes(3).toString('hex');
    const fullUsername = `${baseUsername}-session-${sessionId}`;
    const port = basePort + (i % (maxPort - basePort + 1)); // Rotate 12000–12010

    const proxy = {
      host: ip,
      port,
      username: fullUsername,
      password,
      formatted: `socks5://${fullUsername}:${password}@${ip}:${port}`
    };

    proxies.push(proxy);
  }

  // Save to proxies.json
  const filePath = path.join(__dirname, '../data/proxies.json');
  fs.writeFileSync(filePath, JSON.stringify(proxies, null, 2));
  console.log(`✅ Saved ${amount} proxies to proxies.json`);

  return proxies;
};
