// handlers/fetchgeoproxies.js
const fetchGeoProxies = require('../lib/fetchGeoProxies');
const { addUserProxies } = require('../lib/proxyManager');

module.exports = (bot) => {
  bot.command('fetchgeoproxies', async (ctx) => {
    await ctx.reply('🌍 Fetching fresh UK SOCKS5 proxies from GeoNode...');

    try {
      const proxies = await fetchGeoProxies(); // This already returns ip:port:user:pass
      addUserProxies('global', proxies); // Inject into shared pool

      await ctx.reply(`✅ Fetched and saved ${proxies.length} proxies from GeoNode.`);
    } catch (err) {
      await ctx.reply('❌ Failed to fetch proxies: ' + err.message);
    }
  });
};
