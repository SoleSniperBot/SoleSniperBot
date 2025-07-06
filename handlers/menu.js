const { Markup } = require('telegraf');
const proxyManager = require('../lib/proxyManager');
const fetchGeoProxies = require('../lib/fetchGeoProxies');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserProfiles } = require('../lib/profiles');
const { performSnkrsCheckout } = require('../lib/snkrsLogic');
const updateCookTracker = require('../lib/cookTracker');

const proxyUploadUsers = new Set();
const pendingNikeSkus = {};

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
      `👋 Welcome, ${name}!\n\nUse the buttons below to interact with SoleSniperBot.`,
      mainMenuButtons
    );
  });

  bot.action('fetch_proxies', async (ctx) => {
    ctx.answerCbQuery();
    try {
      const proxies = await fetchGeoProxies();
      proxyManager.addUserProxies('global', proxies);
      await ctx.reply(`🌐 Saved ${proxies.length} fresh GeoNode proxies.`);
    } catch (err) {
      console.error('❌ Geo fetch error:', err.message);
      await ctx.reply('❌ Failed to fetch proxies.');
    }
  });

  bot.action('sendproxies', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      '📩 Send your residential proxies in this format:\n\n`ip:port:user:pass`',
      { parse_mode: 'Markdown' }
    );
    proxyUploadUsers.add(ctx.from.id);
  });

  bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    if (proxyUploadUsers.has(userId)) {
      const proxies = ctx.message.text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.split(':').length >= 2);

      if (proxies.length === 0) {
        await ctx.reply('⚠️ No valid proxies found in your message.');
        return;
      }

      proxyManager.addUserProxies(userId, proxies);
      await ctx.reply(`✅ Added ${proxies.length} proxies to your pool.`);
      proxyUploadUsers.delete(userId);
    }

    if (pendingNikeSkus[userId]) {
      const sku = ctx.message.text.trim().toUpperCase();
      const profiles = getUserProfiles(userId);

      if (!profiles || profiles.length === 0) {
        await ctx.reply('❌ You must add a profile before checkout. Use /profiles');
        return;
      }

      pendingNikeSkus[userId] = sku;

      const buttons = profiles.map((p, i) =>
        Markup.button.callback(`${p.name}`, `nike_profile_${i}`)
      );
      await ctx.reply('Select profile for checkout:', Markup.inlineKeyboard(buttons, { columns: 1 }));
    }
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
      if (!proxy) {
        return ctx.reply('❌ No proxy available or failed to assign.');
      }

      const formatted = `${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}`;

      ctx.reply(`🌍 Your assigned GeoNode proxy:\n\`\`\`\n${formatted}\n\`\`\``, {
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error('❌ Proxy fetch error:', err.message);
      ctx.reply('⚠️ Error fetching proxy. Try again later.');
    }
  });

  bot.action('cooktracker', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📊 To view your success history and stats, type:\n`/cooktracker`', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('addcards', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('💳 To add a card, use the command:\n`/cards` and follow the format.', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('profiles', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📁 Use /profiles to manage your checkout profiles.', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('faq', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('💡 For help and common questions, type:\n`/faq`', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('jdcheckout', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🛒 Send the SKU for JD Sports UK checkout.\n\nFormat: `/jdcheckout SKU123456`', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('nikecheckout', (ctx) => {
    ctx.answerCbQuery();
    const userId = ctx.from.id;
    pendingNikeSkus[userId] = true;
    ctx.reply('👟 Please send the Nike SKU to checkout.');
  });

  bot.action(/nike_profile_(\d+)/, async (ctx) => {
    const userId = ctx.from.id;
    const index = parseInt(ctx.match[1], 10);
    const profiles = getUserProfiles(userId);
    const sku = pendingNikeSkus[userId];

    if (!sku || !profiles || index >= profiles.length) {
      return ctx.reply('❌ Invalid profile or SKU. Start again.');
    }

    const proxy = getLockedProxy(userId);
    if (!proxy) {
      return ctx.reply('⚠️ No proxies available.');
    }

    try {
      await ctx.reply(`🚀 Starting Nike checkout for SKU *${sku}* using profile *${profiles[index].name}*`, {
        parse_mode: 'Markdown'
      });

      await performSnkrsCheckout({
        sku,
        profile: profiles[index],
        proxy,
        userId
      });

      updateCookTracker(userId, sku);
      await ctx.reply('✅ Nike checkout successful!');
    } catch (err) {
      await ctx.reply(`❌ Checkout failed: ${err.message}`);
    } finally {
      releaseLockedProxy(userId);
      delete pendingNikeSkus[userId];
    }
  });
};
