const fetchGeoProxies = require('../lib/fetchGeoProxies');

module.exports = (bot) => {
  bot.command('fetchproxies', async (ctx) => {
    const userId = ctx.from.id;

    // Optional: restrict to admin user ID
    if (userId !== parseInt(process.env.ADMIN_ID)) {
      return ctx.reply('❌ You are not authorized to use this command.');
    }

    const proxies = await fetchGeoProxies();
    if (proxies.length > 0) {
      ctx.reply(`✅ Fetched ${proxies.length} GeoNode proxies and updated the bot.`);
    } else {
      ctx.reply('❌ Failed to fetch proxies from GeoNode.');
    }
  });
};
