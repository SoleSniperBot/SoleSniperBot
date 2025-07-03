const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserProfiles } = require('./profiles');
const { performSnkrsCheckout } = require('../lib/snkrsLogic'); // Your checkout logic
const updateCookTracker = require('../lib/cookTracker');

// Inside your successful SNKRS checkout block:
updateCookTracker(ctx.from.id, sku); // Make sure `sku` is the one used in that checkout

module.exports = (bot) => {
  bot.command('checkout', async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const sku = args[1];
    if (!sku) return ctx.reply('❌ Usage: /checkout <SKU>');

    const proxy = getLockedProxy(userId);
    if (!proxy) {
      return ctx.reply('⚠️ No proxies available. Please fetch or upload proxies first.');
    }

    const profiles = getUserProfiles(userId);
    if (!profiles || profiles.length === 0) {
      releaseLockedProxy(userId);
      return ctx.reply('⚠️ No profiles found. Please add a profile before checkout.');
    }

    let success = false;
    let attempts = 0;
    const maxRetries = 3;

    while (!success && attempts < maxRetries) {
      attempts++;
      try {
        await ctx.reply(`🚀 Attempt ${attempts} - Starting checkout for SKU ${sku} using proxy ${proxy}`);
        await performSnkrsCheckout({
          sku,
          proxy,
          profile: profiles[0],
          userId
        });
        success = true;
        await ctx.reply('✅ Checkout successful!');
      } catch (err) {
        await ctx.reply(`❌ Attempt ${attempts} failed: ${err.message}`);
        if (attempts === maxRetries) {
          await ctx.reply('🔁 All retry attempts failed.');
        }
      }
    }

    releaseLockedProxy(userId);
  });
};
