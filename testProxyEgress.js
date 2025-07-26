require('dotenv').config();
const fs = require('fs');
const { SocksProxyAgent } = require('socks-proxy-agent');
const fetch = require('node-fetch');

// Load the first proxy from your socks5_proxies.json
const proxies = JSON.parse(fs.readFileSync('./data/socks5_proxies.json', 'utf-8'));
const proxy = proxies[0]; // test the first one

const proxyUrl = proxy.formatted;

(async () => {
  try {
    const agent = new SocksProxyAgent(proxyUrl);

    const response = await fetch('https://api.myip.com', { agent });
    const data = await response.json();

    console.log('✅ Proxy egress working:');
    console.log(`IP: ${data.ip}, Country: ${data.country}`);
  } catch (err) {
    console.error('❌ Proxy egress FAILED or blocked by hosting provider');
    console.error(err.message);
  }
})();
