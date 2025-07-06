const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserProfiles } = require('../lib/profiles');
const { performSnkrsCheckout } = require('../lib/snkrsLogic');
const updateCookTracker = require('../lib/cookTracker');

module.exports = (bot) => {
  bot.command('checkout', async (ctx) => {
    const userId = String(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const sku = args[1]?.trim().toUpperCase();

    if (!sku || !sku.match(/^[A-Z0-9]+-\d+$/)) {
      return ctx.reply('❌ Usage: `/checkout <SKU>`\nExample: `/checkout DZ5485-612`', {
        parse_mode: 'Markdown'
      });
    }

    const proxy = await getLockedProxy(userId);
    if (!proxy || proxy.includes('undefined')) {
      return ctx.reply('⚠️ No proxies available. Please upload or fetch fresh ones first.');
    }

    const profiles = getUserProfiles(userId);
    if (!profiles || profiles.length === 0) {
      releaseLockedProxy(userId);
      return ctx.reply('⚠️ No profiles found. Add one via `/profiles`.');
    }

    const profile = profiles[0]; // use first profile by default
    let success = false;
    let attempt = 0;
    const maxRetries = 3;

    while (!success && attempt < maxRetries) {
      attempt++;
      try {
        await ctx.reply(`🚀 Attempt ${attempt}: Starting SNKRS checkout for *${sku}*`, { parse_mode: 'Markdown' });

        await performSnkrsCheckout({ sku, profile, proxy, userId });

        updateCookTracker(userId, sku); // ✅ Track successful checkout
        await ctx.reply('✅ SNKRS checkout successful!');
        success = true;
      } catch (err) {
        await ctx.reply(`❌ Attempt ${attempt} failed: ${err.message}`);
        if (attempt === maxRetries) {
          await ctx.reply('🔁 All retry attempts failed.');
        }
      }
    }

    releaseLockedProxy(userId);
  });
};
