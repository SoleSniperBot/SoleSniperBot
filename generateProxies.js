require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load GeoNode credentials from .env
const user = process.env.GEONODE_USER;
const pass = process.env.GEONODE_PASS;
const host = process.env.GEONODE_HOST || 'proxy.geonode.io';
const port = 12000;

// Path to save proxies
const filePath = path.join(__dirname, '../data/socks5_proxies.json');

// Validate all required environment variables
if (!user || !pass || !host || !port) {
  console.error('❌ Missing required .env values for GEONODE');
  process.exit(1);
}

// Build proxies with dynamic session IDs
const proxies = [];

for (let i = 0; i < 50; i++) {
  const session = crypto.randomBytes(3).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  const sessionUser = `${user}-session-${session}`;
  proxies.push(`${host}:${port}:${sessionUser}:${pass}`);
}

// Write to JSON file
fs.mkdirSync(path.dirname(filePath), { recursive: true });
fs.writeFileSync(filePath, JSON.stringify(proxies, null, 2));
console.log('✅ 50 GeoNode proxies saved with unique sessions to socks5_proxies.json');
