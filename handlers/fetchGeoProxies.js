const fetchGeoProxies = require('../lib/fetchGeoProxies');

module.exports = (bot) => {
  bot.command('fetchgeoproxies', async (ctx) => {
    await ctx.reply('🌍 Fetching fresh UK SOCKS5 proxies from GeoNode...');
    try {
      const proxies = await fetchGeoProxies();
      if (proxies.length === 0) {
        return ctx.reply('⚠️ No proxies found from GeoNode.');
      }
      await ctx.reply(`✅ Fetched and saved ${proxies.length} proxies from GeoNode:\n\n${proxies.join('\n')}`);
    } catch (err) {
      await ctx.reply('❌ Failed to fetch proxies: ' + err.message);
    }
  });
};
