const { Markup } = require('telegraf');
const proxyManager = require('../lib/proxyManager');
const fetchGeoProxies = require('../lib/fetchGeoProxies');

const proxyUploadUsers = new Set();

const mainMenuButtons = Markup.inlineKeyboard([
  [Markup.button.callback('👟 Generate Accounts', 'bulkgen')],
  [Markup.button.callback('📦 Upload Proxies', 'sendproxies')],
  [Markup.button.callback('🔁 Rotate Proxies', 'rotateproxy')],
  [Markup.button.callback('🔍 Monitor SKU', 'monitor_drops')],
  [Markup.button.callback('🛒 JD Auto Checkout', 'jdcheckout')],
  [Markup.button.callback('👟 Nike Auto Checkout', 'nikecheckout')],
  [Markup.button.callback('📂 View My Accounts', 'myaccounts')],
  [Markup.button.callback('🌍 View Proxies', 'viewproxies')],
  [Markup.button.callback('📊 Success Tracker', 'cooktracker')],
  [Markup.button.callback('💳 Add Cards', 'addcards')],
  [Markup.button.callback('📁 Manage Profiles', 'profiles')],
  [Markup.button.callback('💡 FAQ / Help', 'faq')]
]);

module.exports = (bot) => {
  bot.command(['start', 'menu'], async (ctx) => {
    const name = ctx.from.first_name || 'sniper';
    await ctx.reply(
      `👋 Welcome, ${name}!

Use the buttons below to interact with SoleSniperBot.`,
      mainMenuButtons
    );
  });

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
      '📤 Send your residential proxies in this format:
`ip:port:user:pass`

Paste them directly as a plain message.'
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
    ctx.reply('🔄 Proxy rotation is handled automatically per session.');
  });

  bot.action('monitor_drops', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📡 Use /monitor to fetch upcoming Nike SNKRS drops.');
  });

  bot.action('bulkgen', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🧬 Enter how many Nike accounts to generate:

Format: `/bulkgen 10`', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('myaccounts', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📂 To view your generated accounts, type:
`/myaccounts`', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('viewproxies', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🌍 To view your assigned proxies, type:
`/viewproxies`', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('cooktracker', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📊 To view your success history and stats, type:
`/cooktracker`', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('addcards', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('💳 To add a card, use the command:
`/cards` and follow the format.');
  });

  bot.action('profiles', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📁 Use /profiles to manage your checkout profiles.');
  });

  bot.action('faq', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('💡 For help and common questions, type:
`/faq`');
  });

  bot.action('jdcheckout', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🛒 Send the SKU for JD Sports UK checkout.

Format: `/jdcheckout SKU123456`');
  });

  bot.action('nikecheckout', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('👟 Send the SKU for Nike SNKRS checkout.

Format: `/nikecheckout SKU123456`');
  });
};
