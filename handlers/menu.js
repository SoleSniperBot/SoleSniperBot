const { Markup } = require('telegraf');
const proxyManager = require('../lib/proxyManager');
const fetchGeoProxies = require('../lib/fetchGeoProxies');
const { fetchSnkrsDropsDetailed } = require('../lib/snkrsApi');

const proxyUploadUsers = new Set();

const mainMenuButtons = Markup.inlineKeyboard([
  [Markup.button.callback('👟 View SNKRS Drops', 'snkrs')],              // 1. SNKRS drops
  [Markup.button.callback('🌐 Fetch GeoNode Proxies', 'fetch_proxies')],  // 2. fetch proxies
  [Markup.button.callback('📡 Send Proxies', 'sendproxies')],             // 3. upload proxies
  [Markup.button.callback('🔄 Rotate Proxy', 'rotateproxy')],             // 4. proxy rotation info
  [Markup.button.callback('🧬 Generate Nike Accounts', 'bulkgen')],       // 5. gen accounts
  [Markup.button.callback('📬 View My Accounts', 'myaccounts')],          // 6. view accounts
  [Markup.button.callback('📦 List Jigged Addresses', 'listjigged')],     // 7. jigged addresses list
  [Markup.button.callback('🛒 JD Auto Checkout', 'jdcheckout')]           // 8. JD checkout
]);

module.exports = (bot) => {
  // /start command shows the menu
  bot.command('start', async (ctx) => {
    const name = ctx.from.first_name || 'sniper';
    await ctx.reply(
      `👋 Welcome, ${name}!\n\nUse the buttons below to interact with SoleSniperBot.`,
      mainMenuButtons
    );
  });

  // /menu command shows the same menu again
  bot.command('menu', async (ctx) => {
    await ctx.reply(
      '🔘 Main Menu - choose an option below:',
      mainMenuButtons
    );
  });

  // SNKRS drops button handler
  bot.action('snkrs', async (ctx) => {
    ctx.answerCbQuery();
    await ctx.reply('👟 Fetching SNKRS UK upcoming drops...');
    const drops = await fetchSnkrsDropsDetailed();
    if (!drops || drops.length === 0) {
      return ctx.reply('⚠️ No upcoming drops found.');
    }

    for (const drop of drops.slice(0, 5)) {
      await ctx.replyWithPhoto(drop.image, {
        caption: `🔥 *${drop.title}*\nSKU: \`${drop.sku}\`\nColor: ${drop.color}\nPrice: £${drop.retailPrice}\nLaunch: ${drop.launchDate.split('T')[0]}`,
        parse_mode: 'Markdown'
      });
    }
  });

  // Generate Nike accounts
  bot.action('bulkgen', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🧬 Enter how many Nike accounts to generate:\n\nFormat: `/bulkgen 10`', {
      parse_mode: 'Markdown'
    });
  });

  // View my accounts
  bot.action('myaccounts', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📂 To view your generated accounts, type:\n`/myaccounts`', {
      parse_mode: 'Markdown'
    });
  });

  // Upload proxies
  bot.action('sendproxies', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      '📤 Send your residential proxies in this format:\n`ip:port:user:pass`\n\nPaste them directly as a plain message.'
    );
    proxyUploadUsers.add(ctx.from.id);
  });

  // Handle proxy upload messages
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

  // Proxy rotation info
  bot.action('rotateproxy', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🔄 Proxy rotation is handled automatically per session.\nManual control coming soon.');
  });

  // JD checkout
  bot.action('jdcheckout', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🛒 Send the SKU for JD Sports UK checkout.\n\nFormat: `/jdcheckout SKU123456`');
  });

  // Fetch GeoNode proxies
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
