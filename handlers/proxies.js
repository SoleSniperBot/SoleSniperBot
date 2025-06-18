const { fetchSocks5Proxies } = require('../lib/proxyScraper');

module.exports = (bot) => {
  bot.command('proxies', async (ctx) => {
    await ctx.reply('🔍 Fetching SOCKS5 proxies...');
    const proxies = await fetchSocks5Proxies();
    if (proxies.length === 0) return ctx.reply('⚠️ No proxies found.');

    await ctx.reply(`🧩 Top ${proxies.length} SOCKS5 proxies:\n\n` + proxies.map(p => `🔹 ${p}`).join('\n'));
  });
};
