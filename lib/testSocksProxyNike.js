require('dotenv').config();
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

// GeoNode credentials from .env or hardcoded
const username = process.env.GEONODE_USER || 'your_geonode_username';
const password = process.env.GEONODE_PASS || 'your_geonode_password';
const host = process.env.GEONODE_HOST || 'proxy.geonode.io';
const port = process.env.GEONODE_PORT || '12000'; // 🔁 You can rotate from 12000–12010

const proxy = `socks5://${username}:${password}@${host}:${port}`;
const agent = new SocksProxyAgent(proxy);

async function testNikeAccess() {
  try {
    const response = await axios.get('https://www.nike.com/gb', {
      httpsAgent: agent,
      timeout: 15000,
      headers: {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (response.status === 200 && response.data.includes('Nike')) {
      console.log('✅ Proxy is working and Nike loaded.');
    } else {
      console.log('⚠️ Unexpected response from Nike.');
    }
  } catch (err) {
    console.error('❌ Proxy failed or Nike blocked:', err.message);
  }
}

testNikeAccess();
