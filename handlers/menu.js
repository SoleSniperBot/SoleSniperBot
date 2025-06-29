const { Markup } = require('telegraf');
const proxyManager = require('../proxyManager'); // adjust path if needed
const proxyFetcher = require('../proxy'); // your proxy scraping/testing logic

const proxyUploadUsers = new Set();

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
        [Markup.button.callback('📥 Refresh GeoNode Proxies', 'fetch_proxies')],
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

  // Handler for view accounts button
  bot.action('myaccounts', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📂 To view your generated accounts, type:\n`/myaccounts`', {
      parse_mode: 'Markdown'
    });
  });

  // Handler for proxy upload button
  bot.action('sendproxies', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      '📤 Send your residential proxies in this format:\n`ip:port:user:pass`\n\nSend them as a plain message.'
    );
    proxyUploadUsers.add(ctx.from.id);
  });

  // Text handler to receive proxy list from user after clicking 'sendproxies'
  bot.on('text', async (ctx) => {
    if (!proxyUploadUsers.has(ctx.from.id)) return; // ignore if user did not click "Send Proxies"

    const proxies = ctx.message.text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    proxyManager.addUserProxies(ctx.from.id, proxies);

    await ctx.reply(`✅ Added ${proxies.length} proxies to your proxy pool.`);
    proxyUploadUsers.delete(ctx.from.id);
  });

  // Handler for manual proxy rotation info
  bot.action('rotateproxy', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🔄 Proxy rotation is handled automatically per account/session.\nManual override coming soon!');
  });

  // Handler for JD Sports checkout button
  bot.action('jdcheckout', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🛒 Please send the SKU for JD Sports UK checkout.\n\nFormat: `/jdcheckout SKU123456`');
  });

  // Handler for refreshing GeoNode proxies
  bot.action('fetch_proxies', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🌐 Fetching and updating GeoNode proxies...');
    try {
      await proxyFetcher.fetchAndSaveProxies(ctx);
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Failed to fetch GeoNode proxies.');
    }
  });
};
