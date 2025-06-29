const fs = require('fs');
const path = require('path');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

async function fetchAndSaveProxies(ctx) {
  try {
    // Fetch free proxies (adjust URLs and protocols as needed)
    const resSocks5 = await axios.get(
      'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=3000&country=all'
    );
    const resHttp = await axios.get(
      'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=3000&country=all'
    );

    const allProxies = [...resSocks5.data.trim().split('\n'), ...resHttp.data.trim().split('\n')];

    // Remove duplicates & invalid
    const filtered = [...new Set(allProxies.filter(p => p.includes(':')))];

    // Test proxies in parallel (fast)
    const testProxy = async (proxy) => {
      try {
        const agent = new HttpsProxyAgent(`http://${proxy}`);
        const res = await axios.get('https://api.ipify.org?format=json', {
          httpsAgent: agent,
          timeout: 4000,
        });
        return res.status === 200;
      } catch {
        return false;
      }
    };

    const results = await Promise.allSettled(filtered.map(p => testProxy(p)));
    const workingProxies = filtered.filter((_, i) => results[i].status === 'fulfilled' && results[i].value);

    if (!workingProxies.length) {
      await ctx.reply('❌ No working proxies found after testing.');
      return;
    }

    // Save top 50 proxies
    const savePath = path.join(__dirname, '../data/proxies.json');
    fs.writeFileSync(savePath, JSON.stringify(workingProxies.slice(0, 50), null, 2));

    await ctx.reply(`✅ Saved ${workingProxies.length} working proxies (top 50) to data/proxies.json`);
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Error during proxy fetch or test.');
  }
}

module.exports = {
  fetchAndSaveProxies,
};
