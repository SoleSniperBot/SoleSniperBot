const fetchGeoProxies = require('../lib/fetchGeoProxies');
const { addUserProxies } = require('../lib/proxyManager');

module.exports = (bot) => {
  bot.command('fetchgeoproxies', async (ctx) => {
    await ctx.reply('🌍 Fetching fresh UK SOCKS5 proxies from GeoNode...');

    try {
      const proxies = await fetchGeoProxies();

      if (!proxies || proxies.length === 0) {
        return ctx.reply('⚠️ No proxies found from GeoNode.');
      }

      // Save proxies globally (available to all users)
      const formatted = proxies.map(p => `${p.ip}:${p.port}:${p.username}:${p.password}`);
      addUserProxies('global', formatted);

      await ctx.reply(`✅ Fetched and saved ${formatted.length} proxies from GeoNode.`);
    } catch (err) {
      await ctx.reply('❌ Failed to fetch proxies: ' + err.message);
    }
  });
};
