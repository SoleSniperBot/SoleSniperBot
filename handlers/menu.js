const { Markup } = require('telegraf');
const proxyManager = require('../lib/proxyManager');
const fetchGeoProxies = require('../lib/fetchGeoProxies');

const proxyUploadUsers = new Set();

const mainMenuButtons = Markup.inlineKeyboard([
  [Markup.button.callback('🌐 Fetch GeoNode Proxies', 'fetch_proxies')],      // 1. fetch proxies
  [Markup.button.callback('📡 Send Proxies', 'sendproxies')],                 // 2. upload proxies
  [Markup.button.callback('🔄 Rotate Proxy', 'rotateproxy')],                 // 3. proxy rotation info
  [Markup.button.callback('📡 Monitor Nike SNKRS Drops', 'monitor_drops')],   // 4. monitor drops button
  [Markup.button.callback('🧬 Generate Nike Accounts', 'bulkgen')],           // 5. gen accounts
  [Markup.button.callback('📬 View My Accounts', 'myaccounts')],              // 6. view accounts
  [Markup.button.callback('🛒 JD Auto Checkout', 'jdcheckout')]               // 7. JD checkout
]);

module.exports = (bot) => {
  // /start and /menu command to show menu
  bot.command(['start', 'menu'], async (ctx) => {
    const name = ctx.from.first_name || 'sniper';
    await ctx.reply(
      `👋 Welcome, ${name}!\n\nUse the buttons below to interact with SoleSniperBot.`,
      mainMenuButtons
    );
  });

  // Button handlers:
  bot.action('fetch_proxies', async (ctx) => {
    ctx.answerCbQuery();
    try {
      const proxies = await fetchGeoProxies();
      await ctx.reply(`🌐 Saved ${proxies.length} fresh GeoNode proxies.`);
    } catch (err) {
      console.error('❌ Geo fetch error:', err.message);
      await ctx.reply('❌ Failed to fetch proxies.');
    }
  });

  bot.action('sendproxies', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      '📤 Send your residential proxies in this format:\n`ip:port:user:pass`\n\nPaste them directly as a plain message.'
    );
    proxyUploadUsers.add(ctx.from.id);
  });

  bot.on('text', async (ctx) => {
    if (!proxyUploadUsers.has(ctx.from.id)) return;

    const proxies = ctx.message.text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.split(':').length >= 2);

    if (proxies.length === 0) {
      await ctx.reply('⚠️ No valid proxies found in your message.');
      return;
    }

    proxyManager.addUserProxies(ctx.from.id, proxies);
    await ctx.reply(`✅ Added ${proxies.length} proxies to your pool.`);
    proxyUploadUsers.delete(ctx.from.id);
  });

  bot.action('rotateproxy', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🔄 Proxy rotation is handled automatically per session.\nManual control coming soon.');
  });

  bot.action('monitor_drops', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📡 Use /monitor to fetch upcoming Nike SNKRS drops.');
  });

  bot.action('bulkgen', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🧬 Enter how many Nike accounts to generate:\n\nFormat: `/bulkgen 10`', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('myaccounts', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📂 To view your generated accounts, type:\n`/myaccounts`', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('jdcheckout', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🛒 Send the SKU for JD Sports UK checkout.\n\nFormat: `/jdcheckout SKU123456`');
  });
};
