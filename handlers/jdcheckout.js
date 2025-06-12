// handlers/jdcheckout.js
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { Markup } = require('telegraf');

const profilesPath = path.join(__dirname, '../data/profiles.json');

module.exports = (bot) => {
  bot.command('jdcheckout', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
      return ctx.reply('❗ Usage: /jdcheckout <SKU>');
    }

    const sku = args[1].toUpperCase();
    const userId = String(ctx.from.id);
    const profiles = JSON.parse(fs.readFileSync(profilesPath));

    if (!profiles[userId] || !profiles[userId].accounts || profiles[userId].accounts.length === 0) {
      return ctx.reply('⚠️ No accounts saved. Please add your JD accounts first.');
    }

    ctx.reply(`🛒 Starting JD checkout for SKU: ${sku} using your saved accounts...`);

    for (const account of profiles[userId].accounts) {
      await attemptCheckout(ctx, sku, account, 0);
    }
  });
};

async function attemptCheckout(ctx, sku, account, attempt) {
  const maxRetries = 5;
  const delay = 3000 + Math.floor(Math.random() * 2000); // 3–5 seconds

  try {
    // Simulated JD API call
    const response = await fetch(`https://api.fakejd.com/checkout/${sku}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${account.token}`
      },
      body: JSON.stringify({
        sku: sku,
        address: account.address,
        card: account.card
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (data.success) {
      ctx.reply(`✅ Checkout successful for ${account.email}`);
    } else {
      throw new Error(data.message || 'Unknown error');
    }
  } catch (err) {
    if (attempt < maxRetries) {
      ctx.reply(`🔁 Retry ${attempt + 1} for ${account.email}... (${err.message})`);
      setTimeout(() => attemptCheckout(ctx, sku, account, attempt + 1), delay);
    } else {
      ctx.reply(`❌ Failed to checkout for ${account.email} after ${maxRetries} attempts.`);
    }
  }
}
