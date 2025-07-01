const { getUserProfiles } = require('../lib/profile');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getProductNameFromSku } = require('../lib/skuNames');

module.exports = (bot) => {
  bot.action('nike_checkout', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('👟 Please enter the Nike SKU to checkout:');

    // Set up a one-time listener for the next text message from the same user
    const listener = async (ctx2) => {
      if (ctx2.from.id !== ctx.from.id) return; // Ignore others' messages

      const sku = ctx2.message.text.trim().toUpperCase();
      const userId = ctx2.from.id;
      const name = getProductNameFromSku(sku);

      if (name) {
        await ctx2.reply(`🧠 Detected SKU *${sku}* as:\n*${name}*`, { parse_mode: 'Markdown' });
      }

      const profiles = getUserProfiles(userId);
      if (!profiles || profiles.length === 0) {
        bot.off('text', listener); // Remove listener before early return
        return ctx2.reply('❌ You need to add a profile first. Use the inline menu.');
      }

      const proxy = getLockedProxy(userId);
      await ctx2.reply(`🔒 Locked Proxy: ${proxy || 'None'}`);

      // Simulated checkout logic — replace with your actual checkout call
      setTimeout(async () => {
        await ctx2.reply(`✅ Simulated checkout complete for SKU ${sku}`);
        releaseLockedProxy(userId);
      }, 3000);

      bot.off('text', listener); // Remove listener after processing
    };

    bot.on('text', listener);
  });
};
