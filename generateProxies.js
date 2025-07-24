require('dotenv').config();
const fs = require('fs');
const path = require('path');

const user = process.env.GEONODE_USER;
const pass = process.env.GEONODE_PASS;
const host = process.env.GEONODE_HOST || 'proxy.geonode.io';
const port = 12000; // ✅ updated to match your current proxy setup

const filePath = path.join(__dirname, '../data/socks5_proxies.json');

if (!user || !pass || !host || !port) {
  console.error('❌ Missing required .env values for GEONODE');
  process.exit(1);
}

const proxies = [];

for (let i = 0; i < 50; i++) {
  proxies.push(`${host}:${port}:${user}:${
    pass
  }`);
}

fs.writeFileSync(filePath, JSON.stringify(proxies, null, 2));
console.log('✅ 50 GeoNode proxies saved to socks5_proxies.json (port 12000)');
