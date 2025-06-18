const fetch = require('node-fetch');

async function getUKProxies(limit = 15) {
  try {
    const res = await fetch('https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks5.txt');
    const text = await res.text();
    const lines = text.split('\n');

    const ukProxies = lines.filter(line =>
      line.includes(':') &&
      line.includes('.')
    ).slice(0, limit); // Note: This doesn't guarantee UK only — free proxy lists rarely tag by country.

    return ukProxies.map(ip => `socks5://${ip.trim()}`);
  } catch (err) {
    console.error('Proxy scrape failed:', err.message);
    return [];
  }
}

module.exports = { getUKProxies };
