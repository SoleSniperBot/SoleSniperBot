const fs = require('fs');
const path = require('path');
const { Telegraf } = require('telegraf');

// ✅ Adjusted path for root-level generateNikeAccount.js
const generateNikeAccount = require('../generateNikeAccount');

// ✅ Import proxy manager from root
const {
  lockRandomProxy,
  releaseLockedProxy
} = require('../proxyManager');

const accountsPath = path.join(__dirname, '../data/accounts.json');

// Load or initialize account storage
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
      const proxy = lockRandomProxy(ctx.from.id);

      if (!proxy) {
        await ctx.reply(`❌ No available proxies. Please upload more using the 'Send Proxies' button.`);
        break;
      }

      try {
        const account = await generateNikeAccount(proxy);

        const accountObj = {
          email: account.email,
          password: account.password,
          proxy: proxy
        };

        storedAccounts.push(accountObj);
        generated.push(accountObj);

        // Optional: wait 1s between gens
        await new Promise((res) => setTimeout(res, 1000));
      } catch (err) {
        await ctx.reply(`❌ Failed to generate account ${i + 1}: ${err.message}`);
      } finally {
        releaseLockedProxy(ctx.from.id);
      }
    }

    // Save
    fs.writeFileSync(accountsPath, JSON.stringify(storedAccounts, null, 2));

    // Respond
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
