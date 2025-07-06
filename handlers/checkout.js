const { Markup } = require('telegraf');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserProfiles } = require('../lib/profiles');
const { performSnkrsCheckout } = require('../lib/snkrsLogic');
const updateCookTracker = require('../lib/cookTracker');

const skuSessions = new Map(); // Store SKU per user

module.exports = (bot) => {
  // Step 1: Accept /checkout <SKU>
  bot.command('checkout', async (ctx) => {
    const userId = String(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const sku = args[1]?.toUpperCase();

    if (!sku) return ctx.reply('❌ Usage: /checkout <SKU123456>');

    const profiles = getUserProfiles(userId);
    if (!profiles || profiles.length === 0) {
      return ctx.reply('⚠️ No profiles found. Please add one with /profiles');
    }

    skuSessions.set(userId, sku);

    const buttons = profiles.map((p, i) =>
      Markup.button.callback(`${p.name}`, `checkout_profile_${i}`)
    );

    await ctx.reply(`👟 SKU *${sku}* saved.\nNow select a profile for checkout:`, {
      ...Markup.inlineKeyboard(buttons, { columns: 1 }),
      parse_mode: 'Markdown'
    });
  });

  // Step 2: Handle profile selection
  bot.action(/checkout_profile_(\d+)/, async (ctx) => {
    ctx.answerCbQuery();
    const userId = String(ctx.from.id);
    const profileIndex = parseInt(ctx.match[1]);
    const profiles = getUserProfiles(userId);
    const sku = skuSessions.get(userId);

    if (!sku || !profiles || profileIndex >= profiles.length) {
      return ctx.reply('⚠️ Invalid selection. Start again with /checkout <SKU>');
    }

    const profile = profiles[profileIndex];
    const proxy = await getLockedProxy(userId);

    if (!proxy) return ctx.reply('❌ No available proxy. Upload or fetch one first.');

    const proxyStr = `${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}`;
    let success = false;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries && !success; attempt++) {
      try {
        await ctx.reply(`🚀 *Attempt ${attempt}* for SKU *${sku}*\nUsing profile *${profile.name}*\nProxy:\n\`\`\`\n${proxyStr}\n\`\`\``, {
          parse_mode: 'Markdown'
        });

        await performSnkrsCheckout({ sku, profile, proxy: proxyStr, userId });

        updateCookTracker(userId, sku);
        await ctx.reply(`✅ *Success!* Checked out SKU *${sku}*`, { parse_mode: 'Markdown' });
        success = true;
      } catch (err) {
        await ctx.reply(`❌ Attempt ${attempt} failed: ${err.message}`);
        if (attempt < maxRetries) await new Promise(res => setTimeout(res, 2000));
      }
    }

    if (!success) await ctx.reply('🔁 All checkout attempts failed.');
    releaseLockedProxy(userId);
    skuSessions.delete(userId);
  });
};
