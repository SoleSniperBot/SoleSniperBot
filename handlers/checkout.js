const { Markup } = require('telegraf');
const { getUserProfiles } = require('../lib/profile');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getProductNameFromSku } = require('../lib/skuNames');

// Dummy size data function — replace with real size fetch from API or scrape
async function getAvailableSizesForSKU(sku) {
  // Example sizes
  return ['6', '7', '8', '9', '10', '11', '12'];
}

module.exports = (bot) => {
  // Step 1: User taps checkout button or command
  bot.action('nike_checkout', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('👟 Enter the Nike SKU to checkout:');

    // Step 2: Wait for SKU input
    bot.once('text', async (ctx2) => {
      const sku = ctx2.message.text.trim().toUpperCase();
      const userId = ctx2.from.id;
      const name = getProductNameFromSku(sku);

      if (name) {
        await ctx2.reply(`🧠 Detected SKU *${sku}* as:\n*${name}*`, { parse_mode: 'Markdown' });
      }

      // Fetch available sizes
      const sizes = await getAvailableSizesForSKU(sku);
      if (!sizes || sizes.length === 0) {
        return ctx2.reply('❌ No sizes available for this SKU.');
      }

      // Show size selection buttons
      const buttons = sizes.map(size => Markup.button.callback(size, `select_size_${sku}_${size}`));
      await ctx2.reply('👟 Select your size:', Markup.inlineKeyboard(buttons, { columns: 5 }));
    });
  });

  // Step 3: Handle size selection and proceed to checkout
  bot.action(/select_size_(.+)_(.+)/, async (ctx) => {
    const [, sku, size] = ctx.match;
    await ctx.answerCbQuery(`Size ${size} selected for SKU ${sku}`);

    const userId = ctx.from.id;
    const profiles = getUserProfiles(userId);
    if (!profiles || profiles.length === 0) {
      return ctx.reply('❌ You need to add a profile first. Use the inline menu.');
    }

    const proxy = getLockedProxy(userId);
    if (!proxy) {
      return ctx.reply('⚠️ No proxies available. Please upload some proxies first.');
    }

    await ctx.reply(`🔒 Locked proxy: ${proxy}`);

    // Simulate checkout process — replace with real checkout passing sku + size
    setTimeout(async () => {
      await ctx.reply(`✅ Simulated checkout complete for SKU ${sku} in size ${size}`);
      releaseLockedProxy(userId);
    }, 3000);
  });
};
