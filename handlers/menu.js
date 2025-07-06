const { Markup } = require('telegraf');
const proxyManager = require('../lib/proxyManager');
const fetchGeoProxies = require('../lib/fetchGeoProxies');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserProfiles } = require('../lib/profile');
const { performSnkrsCheckout } = require('../lib/snkrsLogic');
const updateCookTracker = require('../lib/cookTracker');

const proxyUploadUsers = new Set();

const mainMenuButtons = Markup.inlineKeyboard([
  [Markup.button.callback('👟 Generate Accounts', 'bulkgen')],
  [
    Markup.button.callback('⚡ Gen 5', 'bulkgen_5'),
    Markup.button.callback('⚡ Gen 10', 'bulkgen_10'),
    Markup.button.callback('⚡ Gen 25', 'bulkgen_25')
  ],
  [Markup.button.callback('📦 Upload Proxies', 'sendproxies')],
  [Markup.button.callback('🔁 Rotate Proxies', 'rotateproxy')],
  [Markup.button.callback('🔍 Monitor SKU', 'monitor_drops')],
  [Markup.button.callback('🛒 JD Auto Checkout', 'jdcheckout')],
  [Markup.button.callback('👟 Nike Auto Checkout', 'start_nike_checkout')],
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
      `👋 Welcome, ${name}!\n\nUse the buttons below to interact with SoleSniperBot.`,
      mainMenuButtons
    );
  });

  // Bulkgen shortcut handlers
  bot.action('bulkgen_5', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('⚡ Generating 5 Nike accounts...\n`/bulkgen 5`', { parse_mode: 'Markdown' });
  });

  bot.action('bulkgen_10', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('⚡ Generating 10 Nike accounts...\n`/bulkgen 10`', { parse_mode: 'Markdown' });
  });

  bot.action('bulkgen_25', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('⚡ Generating 25 Nike accounts...\n`/bulkgen 25`', { parse_mode: 'Markdown' });
  });

  // Existing button handlers...

  bot.action('sendproxies', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      '📩 Send your proxies like:\n\n`ip:port:user:pass`\n\nPaste multiple lines if needed.',
      { parse_mode: 'Markdown' }
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
      return ctx.reply('⚠️ No valid proxies found.');
    }

    proxyManager.addUserProxies(ctx.from.id, proxies);
    await ctx.reply(`✅ Added ${proxies.length} proxy(ies) to your pool.`);
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

  bot.action('viewproxies', async (ctx) => {
    ctx.answerCbQuery();
    const userId = ctx.from.id;

    try {
      const proxy = await getLockedProxy(userId);
      if (!proxy) return ctx.reply('❌ No proxy available.');

      const formatted = `${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}`;
      ctx.reply(`🌍 Your assigned proxy:\n\`\`\`\n${formatted}\n\`\`\``, {
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error('❌ Proxy fetch error:', err.message);
      ctx.reply('⚠️ Error fetching proxy.');
    }
  });

  bot.action('cooktracker', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📊 View success history with:\n`/cooktracker`', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('addcards', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('💳 Add a card using:\n`/cards`', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('profiles', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📁 Use /profiles to manage checkout profiles.', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('faq', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('💡 For help, type:\n`/faq`', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('start_nike_checkout', async (ctx) => {
    ctx.answerCbQuery();
    await ctx.reply('👟 Send the Nike SKU you want to checkout:');
    bot.once('text', async (ctx2) => {
      const sku = ctx2.message.text.trim().toUpperCase();
      const profiles = getUserProfiles(ctx2.from.id);
      if (!profiles || profiles.length === 0) {
        return ctx2.reply('❌ No profiles found. Use /profiles to add one.');
      }

      ctx2.session = ctx2.session || {};
      ctx2.session.nikeSku = sku;

      const buttons = profiles.map((p, i) =>
        Markup.button.callback(`${p.name}`, `nike_profile_${i}`)
      );
      await ctx2.reply('Select profile to use:', Markup.inlineKeyboard(buttons, { columns: 1 }));
    });
  });

  bot.action(/nike_profile_(\d+)/, async (ctx) => {
    ctx.answerCbQuery();
    const index = parseInt(ctx.match[1], 10);
    const userId = ctx.from.id;

    const profiles = getUserProfiles(userId);
    if (!profiles || index >= profiles.length) {
      return ctx.reply('❌ Invalid profile selection.');
    }

    const profile = profiles[index];
    const sku = ctx.session?.nikeSku;
    if (!sku) return ctx.reply('❌ Missing SKU. Please restart checkout.');

    const proxy = await getLockedProxy(userId);
    if (!proxy) return ctx.reply('⚠️ No proxy available. Upload first.');

    try {
      await performSnkrsCheckout({ sku, profile, proxy, userId });
      updateCookTracker(userId, sku);
      await ctx.reply(`✅ Checkout successful for ${sku} using ${profile.name}`);
    } catch (err) {
      await ctx.reply(`❌ Checkout failed: ${err.message}`);
    } finally {
      releaseLockedProxy(userId);
    }
  });

  bot.action('jdcheckout', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🛒 Send the SKU for JD Sports UK checkout.\n\nFormat: `/jdcheckout M123456`', {
      parse_mode: 'Markdown'
    });
  });
};
