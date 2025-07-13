const { Markup } = require('telegraf');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserProfiles } = require('../lib/profile');
const { performSnkrsCheckout } = require('../lib/snkrsLogic');
const updateCookTracker = require('../lib/cookTracker');

// Shared final checkout logic
async function handleNikeCheckout(ctx, sku, profile, size, gender) {
  const userId = ctx.from.id;
  const proxy = getLockedProxy(userId);

  if (!proxy || proxy.includes('undefined')) {
    return ctx.reply('❌ *No proxy available.* Please upload or fetch new proxies.', { parse_mode: 'Markdown' });
  }

  await ctx.reply(`📦 Preparing checkout with profile *${profile.name}*, gender *${gender}*, size *${size}UK*...`, { parse_mode: 'Markdown' });

  const maxRetries = 3;
  let success = false;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await ctx.reply(`🚀 *Attempt ${attempt}* — Checking out SKU \`${sku}\`...`, { parse_mode: 'Markdown' });

    try {
      await performSnkrsCheckout({ sku, proxy, profile, userId, size, gender });
      updateCookTracker(userId, sku);
      await ctx.reply(`✅ *Checkout successful:* \`${sku}\``, { parse_mode: 'Markdown' });
      success = true;
      break;
    } catch (err) {
      await ctx.reply(`❌ *Attempt ${attempt} failed:* ${err.message}`, { parse_mode: 'Markdown' });
    }
  }

  if (!success) {
    await ctx.reply('🔁 *All attempts failed. Please try again later.*', { parse_mode: 'Markdown' });
  }

  releaseLockedProxy(userId);
}

module.exports = (bot) => {
  bot.action('nike_checkout', async (ctx) => {
    ctx.answerCbQuery();
    await ctx.reply('🧾 Please send the Nike SKU you want to checkout:');

    bot.once('text', async (ctx2) => {
      const sku = ctx2.message.text.trim().toUpperCase();
      const profiles = getUserProfiles(ctx2.from.id);

      if (!profiles || profiles.length === 0) {
        return ctx2.reply('❌ *You must add a profile first using* `/profiles`', { parse_mode: 'Markdown' });
      }

      ctx2.session = ctx2.session || {};
      ctx2.session.nikeSku = sku;

      const buttons = profiles.map((p, i) =>
        Markup.button.callback(`${p.name}`, `select_profile_${i}`)
      );
      await ctx2.reply('📋 *Select a profile to use:*', Markup.inlineKeyboard(buttons, { columns: 1 }));
    });
  });

  // Profile selection
  bot.action(/select_profile_(\d+)/, async (ctx) => {
    ctx.answerCbQuery();
    const profileIndex = parseInt(ctx.match[1]);
    const profiles = getUserProfiles(ctx.from.id);
    const profile = profiles[profileIndex];
    if (!profile) return ctx.reply('❌ *Invalid profile.*', { parse_mode: 'Markdown' });

    ctx.session.profile = profile;

    // Ask gender
    await ctx.reply('⚧️ *Select gender:*', Markup.inlineKeyboard([
      Markup.button.callback('Male 👟', 'gender_male'),
      Markup.button.callback('Female 👠', 'gender_female')
    ]));
  });

  // Gender selection
  bot.action(/gender_(male|female)/, async (ctx) => {
    ctx.answerCbQuery();
    const gender = ctx.match[1];
    ctx.session.gender = gender;

    // Ask size
    const sizes = ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5'];
    const buttons = sizes.map(s => Markup.button.callback(`${s} UK`, `size_${s}`));
    const chunked = buttons.reduce((acc, val, i) => {
      if (i % 4 === 0) acc.push([]);
      acc[acc.length - 1].push(val);
      return acc;
    }, []);

    await ctx.reply('📏 *Select shoe size:*', Markup.inlineKeyboard(chunked));
  });

  // Size selection and final checkout
  bot.action(/size_(.+)/, async (ctx) => {
    ctx.answerCbQuery();
    const size = ctx.match[1];
    const { nikeSku, profile, gender } = ctx.session;

    if (!nikeSku || !profile || !gender || !size) {
      return ctx.reply('❌ *Missing info. Restart checkout.*', { parse_mode: 'Markdown' });
    }

    // Optional: Delay scheduler
    await ctx.reply('⏱️ *Would you like to delay the checkout?*\nChoose delay:', Markup.inlineKeyboard([
      Markup.button.callback('No Delay ⚡', `run_now_${size}`),
      Markup.button.callback('10s ⏳', `delay_10_${size}`),
      Markup.button.callback('30s 🕒', `delay_30_${size}`)
    ]));
  });

  // Handle checkout delay selection
  bot.action(/(run_now|delay_10|delay_30)_(.+)/, async (ctx) => {
    ctx.answerCbQuery();
    const delayType = ctx.match[1];
    const size = ctx.match[2];
    const { nikeSku, profile, gender } = ctx.session;

    let delay = 0;
    if (delayType === 'delay_10') delay = 10 * 1000;
    if (delayType === 'delay_30') delay = 30 * 1000;

    await ctx.reply(`⏳ *Checkout will start in ${delay / 1000}s...*`, { parse_mode: 'Markdown' });
    setTimeout(() => {
      handleNikeCheckout(ctx, nikeSku, profile, size, gender);
    }, delay);
  });

  // Manual command /checkout <SKU>
  bot.command('checkout', async (ctx) => {
    await ctx.reply('⚠️ *Please use the button flow: Tap `Nike Checkout` on the menu to proceed.*', { parse_mode: 'Markdown' });
  });
};
