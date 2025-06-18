const { fetchSnkrsReleases } = require('../lib/snkrsApi');

module.exports = (bot) => {
  bot.command('monitor', async (ctx) => {
    await ctx.reply('📡 Fetching upcoming Nike SNKRS drops...');

    try {
      const results = await fetchSnkrsReleases();

      if (results.length === 0) {
        return ctx.reply('❌ No upcoming drops found.');
      }

      const replyText = results.slice(0, 10).map(drop =>
        `👟 *${drop.name}*\nSKU: \`${drop.sku}\`\n📅 Launch: ${drop.launchDate}`
      ).join('\n\n');

      return ctx.replyWithMarkdown(replyText);
    } catch (err) {
      console.error('Monitor Error:', err.message);
      return ctx.reply('⚠️ Failed to fetch drops. Try again later.');
    }
  });
};
