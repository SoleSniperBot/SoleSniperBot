const { Markup } = require('telegraf');
const { getUserProfiles } = require('../lib/profiles');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { performSnkrsCheckout } = require('../lib/snkrsLogic');

const pendingSkuMap = new Map(); // Stores SKU per user awaiting profile select

module.exports = (bot) => {
  // Step 1: Initiate checkout
  bot.action('nike_checkout', async (ctx) => {
    ctx.answerCbQuery();
    await ctx.reply('👟 Please send the Nike SKU you want to checkout (e.g., FJ1234-100):');

    bot.once('text', async (ctx2) => {
      const sku = ctx2.message.text.trim().toUpperCase();
      if (!/^[A-Z0-9\-]{6,}$/.test(sku)) {
        return ctx2.reply('❌ Invalid SKU format. Try again.');
      }

      const profiles = getUserProfiles(ctx2.from.id);
      if (!profiles || profiles.length === 0) {
        return ctx2.reply('⚠️ You must add a profile first using /profiles');
      }

      pendingSkuMap.set(ctx2.from.id, sku); // Store temporarily

      const buttons = profiles.map((p, i) =>
        [Markup.button.callback(`${p.name}`, `select_profile_${i}`)]
      );

      await ctx2.reply('📂 Choose a profile for checkout:', Markup.inlineKeyboard(buttons));
    });
  });

  // Step 2: Profile selected
  bot.action(/select_profile_(\d+)/, async (ctx) => {
    ctx.answerCbQuery();
    const profileIndex = parseInt(ctx.match[1]);
    const userId = String(ctx.from.id);
    const profiles = getUserProfiles(userId);
    const sku = pendingSkuMap.get(userId);

    if (!sku) return ctx.reply('❌ SKU missing. Please restart checkout.');

    if (!profiles || profileIndex >= profiles.length) {
      return ctx.reply('❌ Invalid profile selection.');
    }

    const profile = profiles[profileIndex];
    const proxy = await getLockedProxy(userId);
    if (!proxy) return ctx.reply('❌ No proxy available. Upload some first.');

    const proxyStr = `${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}`;
    await ctx.reply(`🔒 Locked proxy for checkout:\n\`\`\`\n${proxyStr}\n\`\`\``, { parse_mode: 'Markdown' });

    try {
      await performSnkrsCheckout({ sku, profile, proxy: proxyStr, userId });
      await ctx.reply(`✅ Checkout successful for SKU *${sku}* using profile *${profile.name}*!`, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('❌ Checkout error:', err.message);
      await ctx.reply(`❌ Checkout failed: ${err.message}`);
    } finally {
      releaseLockedProxy(userId);
      pendingSkuMap.delete(userId);
    }
  });
};
