const fetch = require('node-fetch');

/**
 * Scrape SOCKS5 proxies from a public proxy provider
 * @returns {Promise<string[]>} List of SOCKS5 proxy strings (ip:port)
 */
async function fetchSocks5Proxies() {
  try {
    const response = await fetch('https://www.proxy-list.download/api/v1/get?type=socks5');
    const body = await response.text();
    const proxies = body.split('\n').filter(Boolean).slice(0, 15); // Return top 15
    return proxies;
  } catch (err) {
    console.error('❌ Proxy scraping failed:', err.message);
    return [];
  }
}

module.exports = { fetchSocks5Proxies };
