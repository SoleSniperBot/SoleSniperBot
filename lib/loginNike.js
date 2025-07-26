const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const proxiesPath = path.join(__dirname, '../data/socks5_proxies.json');

function getRandomProxy() {
  if (!fs.existsSync(proxiesPath)) {
    console.warn('⚠️ No proxy file found, falling back to .env');
    const user = process.env.GEONODE_USER;
    const pass = process.env.GEONODE_PASS;
    const host = process.env.GEONODE_HOST || 'proxy.geonode.io';
    const port = process.env.GEONODE_PORT || 12000;
    return `socks5://${user}:${pass}@${host}:${port}`;
  }

  const list = JSON.parse(fs.readFileSync(proxiesPath));
  if (!list.length) throw new Error('❌ No proxies in file');
  const random = list[Math.floor(Math.random() * list.length)];
  return random.proxy || random.formatted; // support both formats
}

function loginViaTLS(email, password, proxyString) {
  const payload = {
    url: 'https://api.nike.com/identity/login',
    method: 'POST',
    headers: {
      'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
      'content-type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    proxy: proxyString
  };

  const command = `./tls-client --request '${JSON.stringify(payload)}'`;

  try {
    const raw = execSync(command).toString();
    const result = JSON.parse(raw);
    if (result.status !== 200) {
      throw new Error(`Nike login failed with status ${result.status}`);
    }
    console.log('✅ Nike Login Success');
    return result.cookies; // Save this for SNKRS session reuse
  } catch (e) {
    console.error('❌ TLS Login Error:', e.message);
    return null;
  }
}

async function loginNike(email, password) {
  const proxy = getRandomProxy();
  const sessionCookies = loginViaTLS(email, password, proxy);
  return sessionCookies;
}

module.exports = { loginNike };
