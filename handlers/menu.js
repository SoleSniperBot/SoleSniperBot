module.exports = (bot) => {
  // /start command shows main menu
  bot.command('start', async (ctx) => {
    const name = ctx.from.first_name || 'sniper';
    await ctx.reply(
      `👋 Welcome, ${name}!\n\nUse the buttons below to interact with SoleSniperBot.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🧬 Generate Nike Accounts', callback_data: 'bulkgen' }],
            [{ text: '📬 View My Accounts', callback_data: 'myaccounts' }],
            [{ text: '📡 Send Proxies', callback_data: 'sendproxies' }],
            [{ text: '🔄 Rotate Proxy', callback_data: 'rotateproxy' }],
            [{ text: '🛒 JD Auto Checkout', callback_data: 'jdcheckout' }]
          ]
        }
      }
    );
  });

  // Handler for bulkgen button
  bot.action('bulkgen', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🧬 Enter how many Nike accounts to generate:\n\nFormat: `/bulkgen 10`', {
      parse_mode: 'Markdown'
    });
  });

  // Handler for view accounts
  bot.action('myaccounts', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📂 To view your generated accounts, type:\n`/myaccounts`', {
      parse_mode: 'Markdown'
    });
  });

  // Handler for proxy upload
  bot.action('sendproxies', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📤 Send your residential proxies in this format:\n`ip:port:user:pass`\n\nSend them as a plain message.');
  });

  // Handler for manual proxy rotation
  bot.action('rotateproxy', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🔄 Proxy rotation will be handled per account/session automatically.\nManual override not yet implemented.');
  });

  // Handler for JD checkout
  bot.action('jdcheckout', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🛒 Please send the SKU for JD Sports UK checkout.\n\nFormat: `/jdcheckout SKU123456`');
  });
};
