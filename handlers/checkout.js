const { getUserProfiles } = require('../lib/profile');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getProductNameFromSku } = require('../lib/skuNames');

module.exports = (bot) => {
  bot.action('nike_checkout', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('👟 Enter the Nike SKU to checkout:');

    bot.once('text', async (ctx2) => {
      const sku = ctx2.message.text.trim().toUpperCase();
      const userId = ctx2.from.id;
      const name = getProductNameFromSku(sku);

      if (name) {
        await ctx2.reply(`🧠 Detected SKU *${sku}* as:\n*${name}*`, { parse_mode: 'Markdown' });
      }

      const profiles = getUserProfiles(userId);
      if (!profiles || profiles.length === 0) {
        return ctx2.reply('❌ You need to add a profile first. Use the inline menu.');
      }

      const proxy = getLockedProxy(userId);
      await ctx2.reply(`🔒 Locked Proxy: ${proxy || 'None'}`);

      // Simulated checkout logic (replace with real)
      setTimeout(async () => {
        await ctx2.reply(`✅ Simulated checkout complete for SKU ${sku}`);
        releaseLockedProxy(userId);
      }, 3000);
    });
  });
};
