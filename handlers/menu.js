const { Markup } = require('telegraf');
const proxyManager = require('../lib/proxyManager');
const fetchGeoProxies = require('../lib/fetchGeoProxies');

const proxyUploadUsers = new Set();

module.exports = (bot) => {
  // 🟢 /start main menu
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
        [Markup.button.callback('🌐 Fetch GeoNode Proxies', 'fetch_proxies')]
      ])
    );
  });

  // ✅ Handler: Generate accounts
  bot.action('bulkgen', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🧬 Enter how many Nike accounts to generate:\n\nFormat: `/bulkgen 10`', {
      parse_mode: 'Markdown'
    });
  });

  // ✅ Handler: View accounts
  bot.action('myaccounts', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📂 To view your generated accounts, type:\n`/myaccounts`', {
      parse_mode: 'Markdown'
    });
  });

  // ✅ Handler: Upload proxies
  bot.action('sendproxies', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      '📤 Send your residential proxies in this format:\n`ip:port:user:pass`\n\nPaste them directly as a plain message.'
    );
    proxyUploadUsers.add(ctx.from.id);
  });

  // ✅ Handler: Text message after upload trigger
  bot.on('text', async (ctx) => {
    if (!proxyUploadUsers.has(ctx.from.id)) return;

    const proxies = ctx.message.text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.includes(':'));

    if (proxies.length === 0) {
      await ctx.reply('⚠️ No valid proxies found in your message.');
      return;
    }

    proxyManager.addUserProxies(ctx.from.id, proxies);
    await ctx.reply(`✅ Added ${proxies.length} proxies to your pool.`);
    proxyUploadUsers.delete(ctx.from.id);
  });

  // ✅ Handler: Rotate proxy (manual info)
  bot.action('rotateproxy', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🔄 Proxy rotation is handled automatically per session.\nManual control coming soon.');
  });

  // ✅ Handler: JD checkout prompt
  bot.action('jdcheckout', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🛒 Send the SKU for JD Sports UK checkout.\n\nFormat: `/jdcheckout SKU123456`');
  });

  // ✅ Handler: Fetch fresh GeoNode proxies
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
};
