const fs = require('fs');
const path = require('path');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager'); // ✅ Correct path
const { getUserProfiles } = const { generateNikeAccount } = require('../handlers/accountGenerator');

module.exports = (bot) => {
  bot.command('checkout', async (ctx) => {
    const userId = String(ctx.from.id);
    const args = ctx.message.text.split(' ').slice(1);

    if (args.length === 0) {
      return ctx.reply('❗ Please provide a SKU. Example: `/checkout DR0156-200`', { parse_mode: 'Markdown' });
    }

    const sku = args[0].toUpperCase();

    // Load user profiles
    const profileFile = path.join(__dirname, '../data/profiles.json');
    if (!fs.existsSync(profileFile)) {
      return ctx.reply('⚠️ No profiles found. Please upload a card/profile first.');
    }

    const profiles = JSON.parse(fs.readFileSync(profileFile));
    const userProfiles = profiles[userId];

    if (!userProfiles || userProfiles.length === 0) {
      return ctx.reply('⚠️ No profiles saved. Please use the "Add Card" button to upload a profile.');
    }

    // Start simulated checkout for each profile
    await ctx.reply(`🚀 Attempting checkout on SKU *${sku}* with ${userProfiles.length} profile(s)...`, { parse_mode: 'Markdown' });

    for (const profile of userProfiles) {
      const accountEmail = profile.email;

      // Lock a proxy for this user + account combo
      const proxy = getLockedProxy(userId, accountEmail);
      if (!proxy) {
        await ctx.reply(`❌ No proxy available for ${accountEmail}`);
        continue;
      }

      // Simulate checkout logic (replace this with real API requests)
      console.log(`🔒 Using proxy: ${proxy} for ${accountEmail}...`);
      console.log(`🛒 Attempting checkout for SKU ${sku} with ${accountEmail}`);

      // Simulated delay and result
      await new Promise(resolve => setTimeout(resolve, 1500));

      const success = Math.random() > 0.3; // 70% fake success rate
      if (success) {
        await ctx.reply(`✅ Success! Checked out ${sku} with ${accountEmail}`);
      } else {
        await ctx.reply(`❌ Failed checkout for ${accountEmail}`);
      }

      // Release proxy
      releaseLockedProxy(userId, accountEmail);
    }

    await ctx.reply('✅ Checkout process completed.');
  });
};
