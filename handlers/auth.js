const { Markup } = require('telegraf');

module.exports = (bot) => {
  bot.start(async (ctx) => {
    await ctx.reply(
      'Use the buttons below to get started.',
      Markup.inlineKeyboard([
        [Markup.button.callback('📦 Start Monitoring', 'start_monitor')],
        [Markup.button.callback('📅 Calendar', 'calendar')],
        [Markup.button.callback('💳 Add Card', 'add_card')],
        [Markup.button.callback('📂 Upload Accounts', 'upload_accounts')],
        [Markup.button.callback('📊 My Tier', 'my_tier')]
        [Markup.button.callback('🔌 Fetch Proxies', 'fetch_proxies')]
      ])
    );
  });

  bot.action('start_monitor', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('📡 Fetching upcoming Nike SNKRS drops...');
    
    try {
      const { fetchSnkrsUpcoming } = require('../lib/dropFetchers');
      const upcoming = await fetchSnkrsUpcoming();

      if (!upcoming.length) {
        return ctx.reply('❌ No upcoming drops found.');
      }

      for (const drop of upcoming) {
        await ctx.replyWithMarkdown(
          `👟 *${drop.name}*\n🆔 SKU: \`${drop.sku}\`\n📅 Release: ${drop.releaseDate}`
        );
      }
    } catch (err) {
      console.error('❌ Failed to fetch drops:', err.message);
      await ctx.reply('⚠️ Something went wrong. Try again later.');
    }
  });
};
