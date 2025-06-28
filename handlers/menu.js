const { Markup } = require('telegraf');

module.exports = (bot) => {
  bot.command('start', (ctx) => {
    ctx.reply(
      `👋 Welcome to SoleSniperBot! Choose an action:`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🧾 Generate Nike Account', 'bulkgen')],
        [Markup.button.callback('🔌 My Proxies', 'myproxies')],
        [Markup.button.callback('📤 Send Proxies Below', 'send_proxies')],
        [Markup.button.callback('🛒 JD Checkout', 'jd_checkout')]
      ])
    );
  });

  bot.action('send_proxies', async (ctx) => {
    await ctx.reply(
      `📤 Please send your proxies in this format (one per line):\n\n` +
      `\`1.2.3.4:8080\n5.6.7.8:1080\n...\``,
      { parse_mode: 'Markdown' }
    );
    ctx.answerCbQuery();
  });
};
