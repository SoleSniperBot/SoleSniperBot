const { Markup } = require('telegraf');
const { getUserProfiles } = require('../lib/profiles');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { performSnkrsCheckout } = require('../lib/snkrsLogic');
const updateCookTracker = require('../lib/cookTracker');

module.exports = (bot) => {
  // Inline button trigger
  bot.action('nikecheckout', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('👟 Please send the Nike SKU you want to checkout (e.g., DZ5485-612)');

    bot.once('text', async (ctx2) => {
      const sku = ctx2.message.text.trim().toUpperCase();
      const profiles = getUserProfiles(ctx2.from.id);

      if (!profiles || profiles.length === 0) {
        return ctx2.reply('❌ You must add at least one profile before checkout. Use /profiles');
      }

      ctx2.session = ctx2.session || {};
      ctx2.session.nikeSku = sku;

      const buttons = profiles.map((p, i) =>
        Markup.button.callback(`${p.name}`, `nikeprofile_${i}`)
      );

      await ctx2.reply('Select a profile to use for checkout:', Markup.inlineKeyboard(buttons, { columns: 1 }));
    });
  });

  // Handle profile selection
  bot.action(/nikeprofile_(\d+)/, async (ctx) => {
    ctx.answerCbQuery();
    const userId = ctx.from.id;
    const index = parseInt(ctx.match[1], 10);
    const profiles = getUserProfiles(userId);

    if (!profiles || index >= profiles.length) {
      return ctx.reply('❌ Invalid profile. Please try again.');
    }

    const profile = profiles[index];
    const sku = ctx.session?.nikeSku;

    if (!sku) return ctx.reply('❌ SKU missing. Please restart checkout.');

    const proxy = getLockedProxy(userId);
    if (!proxy) return ctx.reply('⚠️ No proxy available.');

    await ctx.reply(`🚀 Starting SNKRS checkout with profile *${profile.name}* and SKU *${sku}*`, { parse_mode: 'Markdown' });

    try {
      await performSnkrsCheckout({ sku, profile, proxy, userId });
      updateCookTracker(userId, sku);
      await ctx.reply('✅ SNKRS checkout successful!');
    } catch (err) {
      await ctx.reply(`❌ Checkout failed: ${err.message}`);
    } finally {
      releaseLockedProxy(userId);
    }
  });
};
