const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserProfiles } = require('../lib/profile');
const { performSnkrsCheckout } = require('../lib/snkrsLogic');
const updateCookTracker = require('../lib/cookTracker');

module.exports = (bot) => {
  bot.command('checkout', async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const sku = args[1];
    if (!sku) {
      return ctx.reply('⚠️ *Usage:* `/checkout <SKU>`', { parse_mode: 'Markdown' });
    }

    const proxy = getLockedProxy(userId);
    if (!proxy || proxy.includes('undefined')) {
      return ctx.reply('❌ *No proxy available.* Upload or fetch fresh proxies first.', { parse_mode: 'Markdown' });
    }

    const profiles = getUserProfiles(userId);
    if (!profiles || profiles.length === 0) {
      releaseLockedProxy(userId);
      return ctx.reply('❌ *No profile found.* Please add one using `/profiles`.', { parse_mode: 'Markdown' });
    }

    const selectedProfile = profiles[0]; // (auto use 1st profile for now)
    const maxRetries = 3;
    let success = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      await ctx.reply(`🚀 *Attempt ${attempt}* — Checking out SKU \`${sku}\` using profile *${selectedProfile.name}*...`, { parse_mode: 'Markdown' });

      try {
        await performSnkrsCheckout({
          sku,
          proxy,
          profile: selectedProfile,
          userId
        });

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
  });
};
