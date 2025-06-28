const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserProfiles } = require('./accountGenerator'); // or wherever your profile logic is
const { performNikeCheckout } = require('../lib/nikeCheckout'); // assumed logic

module.exports = (bot) => {
  bot.command('checkout', async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const sku = args[1];

    if (!sku) {
      return ctx.reply('❌ Please provide an SKU. Example: /checkout DV1234-001');
    }

    const lockedProxy = getLockedProxy(userId);
    if (!lockedProxy) {
      return ctx.reply('⚠️ No available proxy found. Please upload proxies first.');
    }

    try {
      const profiles = getUserProfiles(userId);
      if (!profiles || profiles.length === 0) {
        return ctx.reply('⚠️ No profiles found. Please add a profile first.');
      }

      await ctx.reply(`🛒 Starting Nike checkout for SKU: *${sku}*\n🔐 Proxy: ${lockedProxy.ip}`, { parse_mode: 'Markdown' });

      // ⬇️ Replace this with your real checkout logic
      await performNikeCheckout({
        sku,
        proxy: lockedProxy.ip,
        profile: profiles[0],
        userId
      });

      await ctx.reply('✅ Checkout task completed!');
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Checkout failed: ' + err.message);
    } finally {
      releaseLockedProxy(userId, lockedProxy.ip);
    }
  });
};
