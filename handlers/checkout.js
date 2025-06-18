const { getLockedProxy } = require('../lib/proxyManager');
const profiles = require('../data/profiles.json');
const axios = require('axios');

module.exports = (bot) => {
  bot.command('checkout', async (ctx) => {
    const input = ctx.message.text.split(' ').slice(1).join(' ');
    if (!input) {
      return ctx.reply('❗ Please provide a SKU. Example: /checkout DR0156-200');
    }

    const sku = input.trim().toUpperCase();
    const userId = ctx.from.id.toString();
    const userProfiles = profiles[userId];

    if (!userProfiles || userProfiles.length === 0) {
      return ctx.reply('⚠️ No saved profiles found. Use the "Add Card" button to create one.');
    }

    ctx.reply(`🛒 Starting checkout for SKU: ${sku} using ${userProfiles.length} profiles...`);

    for (const profile of userProfiles) {
      const proxy = getLockedProxy(userId, profile.email);
      if (!proxy) {
        await ctx.reply(`⚠️ No available proxy for ${profile.email}`);
        continue;
      }

      try {
        await attemptCheckout(sku, profile, proxy);
        await ctx.reply(`✅ Successfully checked out ${sku} for ${profile.email}`);
      } catch (err) {
        await ctx.reply(`❌ Failed checkout for ${profile.email}: ${err.message}`);
      }
    }

    ctx.reply('🏁 Checkout process complete.');
  });
};

// === Simulated checkout logic ===
// Replace with real request code
async function attemptCheckout(sku, profile, proxy) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const succeed = Math.random() < 0.8;
      succeed ? resolve() : reject(new Error('Simulated failure'));
    }, 800);
  });
}
