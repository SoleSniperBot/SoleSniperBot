const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const { getLockedProxy } = require('../lib/proxyManager');
const { getProfile } = require('../lib/profileUtils');
const { performJDCheckout } = require('../lib/jdcheckoutUtils');

const skuState = new Map(); // userID => expecting SKU

module.exports = (bot) => {
  // Button to trigger checkout
  bot.command('jdmenu', (ctx) => {
    return ctx.reply('Choose an option:', Markup.inlineKeyboard([
      [Markup.button.callback('Add JD SKU', 'JD_CHECKOUT')]
    ]));
  });

  // Button handler
  bot.action('JD_CHECKOUT', async (ctx) => {
    skuState.set(ctx.from.id, true);
    await ctx.answerCbQuery();
    return ctx.reply('Please enter the JD SKU to checkout:');
  });

  // Text input after pressing button
  bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    if (!skuState.has(userId)) return; // only continue if waiting for SKU
    const sku = ctx.message.text.trim();
    skuState.delete(userId);

    await ctx.reply(`Starting JD checkout for SKU: ${sku}...`);

    const profile = getProfile(userId);
    if (!profile) return ctx.reply('No saved profile found. Please add one.');

    const proxy = getLockedProxy(userId, sku);
    if (!proxy) return ctx.reply('No locked proxy found. Please upload one.');

    try {
      const result = await performJDCheckout({
        userId,
        sku,
        profile,
        proxy,
        retries: 3
      });

      if (result.success) {
        ctx.reply(`Checkout success for SKU ${sku}! Order ID: ${result.orderId}`);
      } else {
        ctx.reply(`Checkout failed after 3 retries. Reason: ${result.reason}`);
      }
    } catch (err) {
      console.error('JD Checkout Error:', err);
      ctx.reply('Unexpected error during checkout. Please try again.');
    }
  });
};
