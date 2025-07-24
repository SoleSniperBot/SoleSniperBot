require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Load GeoNode credentials from .env
const user = process.env.GEONODE_USER;
const pass = process.env.GEONODE_PASS;
const host = process.env.GEONODE_HOST || 'proxy.geonode.io';
const port = 9000;

// File to save the proxies
const filePath = path.join(__dirname, '../data/socks5_proxies.json');

// Ensure all values are present
if (!user || !pass || !host || !port) {
  console.error('❌ Missing required .env values for GEONODE');
  process.exit(1);
}

const proxies = [];

for (let i = 0; i < 50; i++) {
  proxies.push({
    host,
    port,
    username: user,
    password: pass
  });
}

fs.writeFileSync(filePath, JSON.stringify(proxies, null, 2));
console.log('✅ 50 GeoNode proxies saved to proxies.json');
