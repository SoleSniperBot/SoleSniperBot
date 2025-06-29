const { Markup } = require('telegraf');

module.exports = (bot) => {
  // /start command shows main menu
  bot.command('start', async (ctx) => {
    const name = ctx.from.first_name || 'sniper';
    await ctx.reply(
      `👋 Welcome, ${name}!\n\nUse the buttons below to interact with SoleSniperBot.`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🧬 Generate Nike Accounts', 'bulkgen')],
        [Markup.button.callback('📬 View My Accounts', 'myaccounts')],
        [Markup.button.callback('📡 Send Proxies', 'sendproxies')],
        [Markup.button.callback('🔄 Rotate Proxy', 'rotateproxy')],
        [Markup.button.callback('🛒 JD Auto Checkout', 'jdcheckout')],
        [Markup.button.callback('📥 Refresh GeoNode Proxies', 'fetch_proxies')]
      ])
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

  // Handler for manual proxy rotation (inform user)
  bot.action('rotateproxy', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🔄 Proxy rotation will be handled per account/session automatically.\nManual override not yet implemented.');
  });

  // Handler for JD checkout
  bot.action('jdcheckout', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🛒 Please send the SKU for JD Sports UK checkout.\n\nFormat: `/jdcheckout SKU123456`');
  });

  // Handler for fetching GeoNode proxies
  bot.action('fetch_proxies', async (ctx) => {
    ctx.answerCbQuery();
    await ctx.reply('📥 Fetching and refreshing GeoNode proxies...');
    // You should implement the actual proxy fetch logic here or call your proxy fetch handler
  });
};
