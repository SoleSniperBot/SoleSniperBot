const getProxies = require('../lib/proxyScraper');
const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  bot.command('getproxies', async (ctx) => {
    ctx.reply('🛰 Fetching fresh UK SOCKS5 proxies...');
    try {
      const proxies = await getProxies();
      const limitedProxies = proxies.slice(0, 15);

      const filePath = path.join(__dirname, '../data/proxies.json');
      fs.writeFileSync(filePath, JSON.stringify(limitedProxies, null, 2));

      await ctx.reply(`✅ Saved ${limitedProxies.length} proxies to proxies.json`);
    } catch (err) {
      console.error('Failed to fetch proxies:', err.message);
      ctx.reply('❌ Failed to fetch proxies.');
    }
  });
};
