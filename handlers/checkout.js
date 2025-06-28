const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserProfiles } = require('./accountGenerator');
const { performNikeCheckout } = require('../lib/nikeCheckout'); // replace with your actual logic

module.exports = (bot) => {
  // Inline button trigger
  bot.action('nike_checkout', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🔢 Please send the Nike SKU you want to checkout (e.g., DV1234-001)');
    bot.once('text', async (ctx2) => {
      const sku = ctx2.message.text.trim();
      await handleNikeCheckout(bot, ctx2, sku);
    });
  });

  // Optional manual command
  bot.command('checkout', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const sku = args[1];
    if (!sku) return ctx.reply('❌ Please use: /checkout DV1234-001');
    await handleNikeCheckout(bot, ctx, sku);
  });
};

async function handleNikeCheckout(bot, ctx, sku) {
  const userId = ctx.from.id;

  const lockedProxy = getLockedProxy(userId);
  if (!lockedProxy) {
    return ctx.reply('⚠️ No proxies available. Please upload proxies first.');
  }

  const profiles = getUserProfiles(userId);
  if (!profiles || profiles.length === 0) {
    releaseLockedProxy(userId, lockedProxy.ip);
    return ctx.reply('⚠️ No profiles found. Please add one before checking out.');
  }

  let attempt = 0;
  const maxRetries = 3;
  let success = false;

  while (attempt < maxRetries && !success) {
    attempt++;
    try {
      await ctx.reply(`🚀 Attempt ${attempt}: Starting Nike checkout for SKU *${sku}*`, { parse_mode: 'Markdown' });

      await performNikeCheckout({
        sku,
        proxy: lockedProxy.ip,
        profile: profiles[0],
        userId
      });

      await ctx.reply('✅ Nike checkout complete!');
      success = true;
    } catch (err) {
      console.error(err);
      await ctx.reply(`❌ Attempt ${attempt} failed: ${err.message}`);
      if (attempt >= maxRetries) {
        await ctx.reply('🔁 All retry attempts failed.');
      }
    }
  }

  releaseLockedProxy(userId, lockedProxy.ip);
}
