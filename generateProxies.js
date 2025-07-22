const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/proxies.json');
const user = process.env.GEONODE_USER;
const pass = process.env.GEONODE_PASS;
const host = process.env.GEONODE_HOST || 'proxy.geonode.io';
const port = 9000; // make sure this matches your working port

const proxies = [];

for (let i = 0; i < 50; i++) {
  proxies.push({
    host,
    port,
    username: user,
    password: pass,
    formatted: `http://${user}:${pass}@${host}:${port}`
  });
}

fs.writeFileSync(filePath, JSON.stringify(proxies, null, 2));
console.log('✅ Proxies generated with full structure.');
