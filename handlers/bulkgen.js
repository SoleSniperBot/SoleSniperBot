const fs = require('fs');
const path = require('path');

// Adjust path if your generateNikeAccount.js is in root
const generateNikeAccount = require('../generateNikeAccount');

// Import proxy manager from lib folder
const {
  lockRandomProxy,
  releaseLockedProxy
} = require('../lib/proxyManager');

const accountsPath = path.join(__dirname, '../data/accounts.json');

// Load or initialize stored accounts
let storedAccounts = fs.existsSync(accountsPath)
  ? JSON.parse(fs.readFileSync(accountsPath, 'utf8'))
  : [];

module.exports = (bot) => {
  bot.command('bulkgen', async (ctx) => {
    const input = ctx.message.text.split(' ')[1];
    const count = parseInt(input);

    if (!count || count < 1 || count > 50) {
      return ctx.reply('⚠️ Usage: /bulkgen <1-50>');
    }

    await ctx.reply(`⏳ Generating ${count} Nike account(s)...`);

    let generated = [];

    for (let i = 0; i < count; i++) {
      // Lock a proxy for this user/session
      const proxy = lockRandomProxy(ctx.from.id);

      if (!proxy) {
        await ctx.reply(`❌ No available proxies. Please upload more using the 'Send Proxies' button.`);
        break;
      }

      try {
        // Pass the locked proxy to your account generator if it supports it
        const account = await generateNikeAccount(proxy);

        const accountObj = {
          email: account.email,
          password: account.password,
          proxy: proxy
        };

        storedAccounts.push(accountObj);
        generated.push(accountObj);

        // Optional delay between generations
        await new Promise((res) => setTimeout(res, 1000));
      } catch (err) {
        await ctx.reply(`❌ Failed to generate account ${i + 1}: ${err.message}`);
      } finally {
        // Always release proxy lock after use
        releaseLockedProxy(ctx.from.id);
      }
    }

    // Save updated accounts file
    fs.writeFileSync(accountsPath, JSON.stringify(storedAccounts, null, 2));

    // Reply with results
    if (generated.length > 0) {
      const preview = generated.map((a, i) =>
        `#${i + 1}\nEmail: ${a.email}\nPassword: ${a.password}\nProxy: ${a.proxy}\n`
      ).join('\n');

      await ctx.reply(`✅ Generated ${generated.length} account(s):\n\n` + preview);
    } else {
      await ctx.reply('❌ No accounts were generated.');
    }
  });
};
