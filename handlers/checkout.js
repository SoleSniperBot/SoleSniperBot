const { getUserProfiles } = require('../lib/profile');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getProductNameFromSku } = require('../lib/skuNames');

module.exports = (bot) => {
  bot.action('nike_checkout', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('👟 Enter the Nike SKU to checkout:');

    // Wait for user SKU input
    bot.once('text', async (ctx2) => {
      const sku = ctx2.message.text.trim().toUpperCase();
      const userId = ctx2.from.id;

      // Optional SKU name detection
      const productName = getProductNameFromSku(sku);
      if (productName) {
        await ctx2.reply(`🧠 Detected SKU *${sku}* as:\n*${productName}*`, { parse_mode: 'Markdown' });
      } else {
        await ctx2.reply(`🧾 SKU Entered: *${sku}*`, { parse_mode: 'Markdown' });
      }

      // Profile check
      const profiles = getUserProfiles(userId);
      if (!profiles || profiles.length === 0) {
        return ctx2.reply('❌ You need to add a profile first. Use the inline menu.');
      }

      // Proxy lock check
      const proxy = getLockedProxy(userId);
      if (!proxy) {
        return ctx2.reply('⚠️ No proxy locked to your session. Use /viewproxies or /bulkgen to lock one.');
      }

      await ctx2.reply(`🔒 Using Locked Proxy: ${proxy}`);

      // Simulated checkout (replace with real automation)
      await ctx2.reply(`🛒 Attempting checkout for SKU *${sku}*...`, { parse_mode: 'Markdown' });

      setTimeout(async () => {
        await ctx2.reply(`✅ Simulated checkout complete for SKU *${sku}*`, { parse_mode: 'Markdown' });
        releaseLockedProxy(userId);
      }, 3000);
    });
  });
};
