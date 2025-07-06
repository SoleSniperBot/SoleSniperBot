const { Markup } = require('telegraf');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserProfiles } = require('../lib/profile');
const { performSnkrsCheckout } = require('../lib/snkrsLogic');
const updateCookTracker = require('../lib/cookTracker');

// Shared function for checkout logic
async function handleNikeCheckout(ctx, sku, profile) {
  const userId = ctx.from.id;
  const proxy = getLockedProxy(userId);

  if (!proxy || proxy.includes('undefined')) {
    return ctx.reply('❌ *No proxy available.* Please upload or fetch new proxies.', { parse_mode: 'Markdown' });
  }

  let success = false;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await ctx.reply(`🚀 *Attempt ${attempt}* — Checking out SKU \`${sku}\` using profile *${profile.name}*...`, { parse_mode: 'Markdown' });

    try {
      await performSnkrsCheckout({ sku, proxy, profile, userId });

      updateCookTracker(userId, sku);
      await ctx.reply(`✅ *Checkout successful for SKU:* \`${sku}\``, { parse_mode: 'Markdown' });
      success = true;
      break;
    } catch (err) {
      await ctx.reply(`❌ *Attempt ${attempt} failed:* ${err.message}`, { parse_mode: 'Markdown' });
    }
  }

  if (!success) {
    await ctx.reply('🔁 *All attempts failed. Please try again later.*', { parse_mode: 'Markdown' });
  }

  releaseLockedProxy(userId);
}

module.exports = (bot) => {
  // Inline button trigger
  bot.action('nike_checkout', async (ctx) => {
    ctx.answerCbQuery();
    await ctx.reply('👟 Please send the Nike SKU you want to checkout:');

    bot.once('text', async (ctx2) => {
      const sku = ctx2.message.text.trim().toUpperCase();
      const profiles = getUserProfiles(ctx2.from.id);

      if (!profiles || profiles.length === 0) {
        return ctx2.reply('❌ *You must add a profile first using* `/profiles`', { parse_mode: 'Markdown' });
      }

      if (profiles.length === 1) {
        await handleNikeCheckout(ctx2, sku, profiles[0]);
        return;
      }

      // Store SKU in session and prompt for profile selection
      ctx2.session = ctx2.session || {};
      ctx2.session.nikeSku = sku;

      const buttons = profiles.map((p, i) =>
        Markup.button.callback(`${p.name}`, `select_profile_${i}`)
      );
      await ctx2.reply('📋 *Select a profile to use:*', Markup.inlineKeyboard(buttons, { columns: 1 }));
    });
  });

  // Profile selection from inline buttons
  bot.action(/select_profile_(\d+)/, async (ctx) => {
    ctx.answerCbQuery();
    const profileIndex = parseInt(ctx.match[1], 10);
    const profiles = getUserProfiles(ctx.from.id);

    if (!profiles || !profiles[profileIndex]) {
      return ctx.reply('❌ *Invalid profile selected.*', { parse_mode: 'Markdown' });
    }

    const sku = ctx.session?.nikeSku;
    if (!sku) {
      return ctx.reply('❌ *Missing SKU. Start checkout again.*', { parse_mode: 'Markdown' });
    }

    await handleNikeCheckout(ctx, sku, profiles[profileIndex]);
  });

  // Manual command version: /checkout <SKU>
  bot.command('checkout', async (ctx) => {
    const args = ctx.message.text.trim().split(' ');
    const sku = args[1];

    if (!sku) {
      return ctx.reply('❗ *Usage:* `/checkout <SKU>`', { parse_mode: 'Markdown' });
    }

    const profiles = getUserProfiles(ctx.from.id);

    if (!profiles || profiles.length === 0) {
      return ctx.reply('❌ *You must add a profile using* `/profiles`', { parse_mode: 'Markdown' });
    }

    await handleNikeCheckout(ctx, sku.toUpperCase(), profiles[0]);
  });
};
