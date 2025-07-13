const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserProfiles } = require('../lib/profile');
const updateCookTracker = require('../lib/cookTracker');
const { loadSessionCookies } = require('../lib/sessionLoader');

puppeteer.use(StealthPlugin());

// Shared function for browser-based checkout
async function handleNikeCheckout(ctx, sku, profile) {
  const userId = String(ctx.from.id);
  const proxy = getLockedProxy(userId);

  if (!proxy || proxy.includes('undefined')) {
    return ctx.reply('❌ *No proxy available.* Please upload or fetch new proxies.', { parse_mode: 'Markdown' });
  }

  const accountsPath = path.join(__dirname, '../data/accounts.json');
  const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
  const userAccounts = accounts.filter(acc => acc.userId === userId);

  if (userAccounts.length === 0) {
    return ctx.reply('❌ *No Nike accounts found for checkout.* Please generate them with /bulkgen', { parse_mode: 'Markdown' });
  }

  let success = false;
  const maxRetries = 3;

  for (const acc of userAccounts) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      await ctx.reply(`🚀 *Attempt ${attempt}* — Checking out SKU \`${sku}\` using account *${acc.email}*...`, { parse_mode: 'Markdown' });

      try {
        const browser = await puppeteer.launch({
          headless: true,
          args: [`--proxy-server=${acc.proxy}`, '--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();

        // Set session cookies
        const cookies = loadSessionCookies(acc.email);
        await page.setCookie(...cookies);

        await page.goto(`https://www.nike.com/gb/launch/t/${sku}`, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        // Example simulated checkout steps:
        console.log(`🛒 [Browser] Loaded SNKRS page for ${acc.email} - SKU ${sku}`);

        await browser.close();

        updateCookTracker(userId, sku);
        await ctx.reply(`✅ *Checkout simulated successfully with:* \`${acc.email}\``, { parse_mode: 'Markdown' });
        success = true;
        break;
      } catch (err) {
        await ctx.reply(`❌ *Attempt ${attempt} failed for ${acc.email}:* ${err.message}`, { parse_mode: 'Markdown' });
      }
    }

    if (success) break;
  }

  if (!success) {
    await ctx.reply('🔁 *All attempts failed. Try again later.*', { parse_mode: 'Markdown' });
  }

  releaseLockedProxy(userId);
}

module.exports = (bot) => {
  // Inline button flow
  bot.action('nike_checkout', async (ctx) => {
    ctx.answerCbQuery();
    await ctx.reply('👟 Please send the Nike SKU you want to checkout:');

    bot.once('text', async (ctx2) => {
      const sku = ctx2.message.text.trim().toUpperCase();
      const profiles = getUserProfiles(ctx2.from.id);

      if (!profiles || profiles.length === 0) {
        return ctx2.reply('❌ *You must add a profile first using* `/profiles`', { parse_mode: 'Markdown' });
      }

      if (profiles.length === 1) {
        await handleNikeCheckout(ctx2, sku, profiles[0]);
        return;
      }

      ctx2.session = ctx2.session || {};
      ctx2.session.nikeSku = sku;

      const buttons = profiles.map((p, i) =>
        Markup.button.callback(`${p.name}`, `select_profile_${i}`)
      );

      await ctx2.reply('📋 *Select a profile to use:*', Markup.inlineKeyboard(buttons, { columns: 1 }));
    });
  });

  // Profile selector button
  bot.action(/select_profile_(\d+)/, async (ctx) => {
    ctx.answerCbQuery();
    const profileIndex = parseInt(ctx.match[1], 10);
    const profiles = getUserProfiles(ctx.from.id);

    if (!profiles || !profiles[profileIndex]) {
      return ctx.reply('❌ *Invalid profile selected.*', { parse_mode: 'Markdown' });
    }

    const sku = ctx.session?.nikeSku;
    if (!sku) {
      return ctx.reply('❌ *Missing SKU. Start checkout again.*', { parse_mode: 'Markdown' });
    }

    await handleNikeCheckout(ctx, sku, profiles[profileIndex]);
  });

  // Manual command version
  bot.command('checkout', async (ctx) => {
    const args = ctx.message.text.trim().split(' ');
    const sku = args[1];

    if (!sku) {
      return ctx.reply('❗ *Usage:* `/checkout <SKU>`', { parse_mode: 'Markdown' });
    }

    const profiles = getUserProfiles(ctx.from.id);

    if (!profiles || profiles.length === 0) {
      return ctx.reply('❌ *You must add a profile using* `/profiles`', { parse_mode: 'Markdown' });
    }

    await handleNikeCheckout(ctx, sku.toUpperCase(), profiles[0]);
  });
};
