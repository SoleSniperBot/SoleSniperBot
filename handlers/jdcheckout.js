const { Markup } = require('telegraf');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserProfiles } = require('../lib/profile');
const { performJDCheckout } = require('../lib/jdLogic');
const updateCookTracker = require('../lib/cookTracker');

const jdSkuSessions = new Map(); // Store SKU per user

module.exports = (bot) => {
  // Step 1: Inline button or /jdcheckout command
  bot.action('jd_checkout', async (ctx) => {
    ctx.answerCbQuery();
    await ctx.reply('📦 Please send the JD SKU (e.g., M123456)');
    bot.once('text', async (ctx2) => {
      const sku = ctx2.message.text.trim().toUpperCase();
      await startJDProfileFlow(ctx2, sku);
    });
  });

  bot.command('jdcheckout', async (ctx) => {
    const sku = ctx.message.text.split(' ')[1]?.toUpperCase();
    if (!sku) return ctx.reply('❌ Usage: /jdcheckout M123456');
    await startJDProfileFlow(ctx, sku);
  });
};

// Step 2: Show profile selection buttons
async function startJDProfileFlow(ctx, sku) {
  const userId = String(ctx.from.id);
  const profiles = getUserProfiles(userId);
  if (!profiles || profiles.length === 0) {
    return ctx.reply('❌ You must add at least one profile first. Use /profiles');
  }

  jdSkuSessions.set(userId, sku);

  const buttons = profiles.map((p, i) =>
    Markup.button.callback(`${p.name}`, `jd_profile_${i}`)
  );

  await ctx.reply(
    `🛒 SKU *${sku}* saved.\nChoose a profile for JD checkout:`,
    { ...Markup.inlineKeyboard(buttons, { columns: 1 }), parse_mode: 'Markdown' }
  );
}

// Step 3: Handle selected profile and run checkout
module.exports.handleJDProfileSelection = (bot) => {
  bot.action(/jd_profile_(\d+)/, async (ctx) => {
    ctx.answerCbQuery();
    const userId = String(ctx.from.id);
    const profileIndex = parseInt(ctx.match[1], 10);
    const profiles = getUserProfiles(userId);
    const sku = jdSkuSessions.get(userId);

    if (!sku || profileIndex >= profiles.length) {
      return ctx.reply('❌ Invalid profile or missing SKU. Start again with /jdcheckout');
    }

    const profile = profiles[profileIndex];
    const proxy = await getLockedProxy(userId);
    if (!proxy) return ctx.reply('⚠️ No proxies available. Please fetch or upload first.');

    const proxyStr = `${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}`;
    let success = false;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries && !success; attempt++) {
      try {
        await ctx.reply(`🚀 *Attempt ${attempt}* for *${sku}*\nUsing profile *${profile.name}*\nProxy:\n\`\`\`\n${proxyStr}\n\`\`\``, {
          parse_mode: 'Markdown'
        });

        await performJDCheckout({ sku, proxy: proxyStr, profile, userId });

        updateCookTracker(userId, sku);
        await ctx.reply(`✅ JD Checkout successful for SKU *${sku}*!`, { parse_mode: 'Markdown' });
        success = true;
      } catch (err) {
        await ctx.reply(`❌ Attempt ${attempt} failed: ${err.message}`);
      }
    }

    if (!success) await ctx.reply('🔁 All checkout attempts failed.');
    releaseLockedProxy(userId);
    jdSkuSessions.delete(userId);
  });
};
