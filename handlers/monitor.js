const { fetchSnkrsUpcoming } = require('./../lib/dropFetchers');

module.exports = (bot) => {
  bot.command('monitor', async (ctx) => {
    await ctx.reply('📡 Fetching upcoming Nike/SNKRS drops...');

    try {
      const upcoming = await fetchSnkrsUpcoming();

      if (!upcoming.length) {
        return ctx.reply('❌ No upcoming drops found right now.');
      }

      for (const drop of upcoming) {
        await ctx.replyWithMarkdown(`👟 *${drop.name}*\n🆔 SKU: \`${drop.sku}\`\n📅 Release: ${drop.releaseDate}`);
      }
    } catch (err) {
      console.error('Monitor fetch failed:', err);
      ctx.reply('❌ Failed to fetch drops. Try again later.');
    }
  });
};
