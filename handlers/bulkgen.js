const fs = require('fs');
const path = require('path');
const generateNikeAccount = require('../lib/generateNikeAccount');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');

const accountsPath = path.join(__dirname, '../data/accounts.json');

module.exports = (bot) => {
  bot.command('bulkgen', async (ctx) => {
    const amount = parseInt(ctx.message.text.split(' ')[1]);
    if (!amount || amount < 1 || amount > 50) {
      return ctx.reply('⚠️ Usage: /bulkgen <1-50>');
    }

    await ctx.reply(`⏳ Creating ${amount} Nike account(s)...`);

    let accounts = fs.existsSync(accountsPath)
      ? JSON.parse(fs.readFileSync(accountsPath))
      : [];

    const created = [];

    for (let i = 0; i < amount; i++) {
      let proxyObj;

      try {
        proxyObj = await getLockedProxy(ctx.from.id);
        const proxy = proxyObj?.formatted;

        if (!proxy || proxy.includes('undefined')) {
          await ctx.reply('❌ No valid proxy available at the moment.');
          break;
        }

        const result = await generateNikeAccount(proxy, ctx);
        if (!result || !result.email || !result.password) {
          throw new Error('Account generation failed or returned empty result.');
        }

        // Save to disk with secrets (email + password)
        accounts.push({
          email: result.email,
          password: result.password,
          proxy
        });

        // Push safe result for Telegram reply
        created.push({
          email: result.email,
          password: result.password
        });

      } catch (err) {
        await ctx.reply(`❌ Failed account ${i + 1}: ${err.message}`);
      } finally {
        if (proxyObj) releaseLockedProxy(proxyObj);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));

    if (created.length) {
      const summary = created
        .map((acc, i) => `#${i + 1} 📧 ${acc.email}\n🔐 ${acc.password}`)
        .join('\n\n');

      await ctx.reply(`✅ Created ${created.length} Nike account(s):\n\n${summary}`);
    } else {
      await ctx.reply('❌ No accounts were created.');
    }
  });
};
