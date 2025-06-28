const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserProfiles } = require('./accountGenerator');
const { performJDCheckout } = require('../lib/jdLogic'); // assumed JD checkout module

module.exports = (bot) => {
  bot.command('jdcheckout', async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const sku = args[1];

    if (!sku) {
      return ctx.reply('❌ Please provide a JD SKU. Example: /jdcheckout M123456');
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

      await ctx.reply(`🛍️ Starting JD checkout for SKU: *${sku}*\n🔐 Proxy: ${lockedProxy.ip}`, { parse_mode: 'Markdown' });

      // Replace this with your real JD checkout logic
      await performJDCheckout({
        sku,
        proxy: lockedProxy.ip,
        profile: profiles[0],
        userId
      });

      await ctx.reply('✅ JD checkout complete!');
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ JD checkout failed: ' + err.message);
    } finally {
      releaseLockedProxy(userId, lockedProxy.ip);
    }
  });
};
