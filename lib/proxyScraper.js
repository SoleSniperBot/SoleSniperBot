const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function getProxies() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks5.txt');
    const text = await res.text();
    const proxies = text.split('\n').filter(p => p.trim());
    return proxies.slice(0, 15); // first 15
  } catch (err) {
    console.error('❌ Failed to fetch proxies:', err.message);
    return [];
  }
}

module.exports = getProxies;
