const { Markup } = require('telegraf');
const { getUserProfiles } = require('../lib/profiles'); // Your profiles module
const { getUnlockedProxy, lockProxy, releaseProxy } = require('../lib/proxyManager'); // Proxy manager
const { performSnkrsCheckout } = require('../lib/snkrsLogic'); // Your Nike checkout logic

module.exports = (bot) => {
  // Step 1: Start checkout, ask for SKU
  bot.action('nike_checkout', async (ctx) => {
    ctx.answerCbQuery();
    await ctx.reply('👟 Please send the Nike SKU you want to checkout:');
    
    bot.once('text', async (ctx2) => {
      const sku = ctx2.message.text.trim().toUpperCase();
      const profiles = getUserProfiles(ctx2.from.id);
      if (!profiles || profiles.length === 0) {
        return ctx2.reply('❌ You must add at least one profile before checkout. Use /profiles');
      }

      // Save SKU and prompt profile selection with inline buttons
      ctx2.session = ctx2.session || {};
      ctx2.session.nikeSku = sku;

      const buttons = profiles.map((p, i) =>
        Markup.button.callback(`${p.name}`, `select_profile_${i}`)
      );
      await ctx2.reply('Select a profile to use for checkout:', Markup.inlineKeyboard(buttons, { columns: 1 }));
    });
  });

  // Step 2: Profile selected, do checkout
  bot.action(/select_profile_(\d+)/, async (ctx) => {
    ctx.answerCbQuery();
    const profileIndex = parseInt(ctx.match[1], 10);
    const userId = ctx.from.id;

    const profiles = getUserProfiles(userId);
    if (!profiles || profiles.length === 0 || profileIndex >= profiles.length) {
      return ctx.reply('❌ Invalid profile selected.');
    }
    const profile = profiles[profileIndex];

    const sku = ctx.session?.nikeSku;
    if (!sku) {
      return ctx.reply('❌ SKU missing, please start checkout again.');
    }

    // Get and lock a free proxy
    const proxy = getUnlockedProxy(userId);
    if (!proxy) return ctx.reply('⚠️ No free proxies available. Please upload proxies first.');

    lockProxy(userId, proxy.ip);

    await ctx.reply(`🔒 Locked proxy ${proxy.ip} for checkout.`);

    try {
      await performSnkrsCheckout({ sku, profile, proxy: proxy.ip, userId });

      await ctx.reply(`✅ Checkout successful for SKU ${sku} using profile ${profile.name}!`);
    } catch (err) {
      console.error('Checkout error:', err);
      await ctx.reply(`❌ Checkout failed: ${err.message}`);
    } finally {
      releaseProxy(userId, proxy.ip);
    }
  });
};
