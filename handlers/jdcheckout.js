// handlers/jdcheckout.js
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserProfiles } = require('../lib/profile');
const { performJDCheckout } = require('../lib/jdLogic'); // Ensure this exists

module.exports = (bot) => {
  // Inline button trigger
  bot.action('jd_checkout', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📦 Please send the JD SKU you want to checkout (e.g., M123456)');
    bot.once('text', async (ctx2) => {
      const sku = ctx2.message.text.trim();
      await handleJDCheckout(ctx2, sku);
    });
  });

  // Optional manual command
  bot.command('jdcheckout', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const sku = args[1];
    if (!sku) return ctx.reply('❌ Usage: /jdcheckout M123456');
    await handleJDCheckout(ctx, sku);
  });
};

async function handleJDCheckout(ctx, sku) {
  const userId = ctx.from.id;

  const lockedProxy = getLockedProxy(userId);
  if (!lockedProxy) {
    return ctx.reply('⚠️ No proxies available. Please upload proxies first.');
  }

  const profiles = getUserProfiles(userId);
  if (!profiles || profiles.length === 0) {
    releaseLockedProxy(userId);
    return ctx.reply('⚠️ No profiles found. Please add one before checking out.');
  }

  let attempt = 0;
  const maxRetries = 3;
  let success = false;

  while (attempt < maxRetries && !success) {
    attempt++;
    try {
      await ctx.reply(`🚀 Attempt ${attempt}: Starting JD checkout for SKU *${sku}*`, { parse_mode: 'Markdown' });

      await performJDCheckout({
        sku,
        proxy: lockedProxy,
        profile: profiles[0],
        userId
      });

      await ctx.reply('✅ JD checkout complete!');
      success = true;
    } catch (err) {
      console.error(err);
      await ctx.reply(`❌ Attempt ${attempt} failed: ${err.message}`);
      if (attempt >= maxRetries) {
        await ctx.reply('🔁 All retry attempts failed.');
      }
    }
  }

  releaseLockedProxy(userId);
}
