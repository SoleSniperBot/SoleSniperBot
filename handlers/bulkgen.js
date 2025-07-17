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

    await ctx.reply(`🔄 Creating ${amount} Nike account(s)...`);

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
          await ctx.reply('❌ No valid proxy available right now.');
          break;
        }

        const result = await generateNikeAccount(proxy, ctx);

        if (!result || !result.email || !result.password) {
          throw new Error('Account creation failed or returned incomplete data.');
        }

        // Save full data securely
        accounts.push({
          email: result.email,
          password: result.password,
          proxy: proxy
        });

        // Mask proxy for Telegram logs
        const masked = proxy.replace(/:\/\/.*?:.*?@/, '://****:****@');
        created.push({
          email: result.email,
          password: result.password,
          proxy: masked
        });
      } catch (err) {
        await ctx.reply(`❌ Account ${i + 1} failed: ${err.message}`);
      } finally {
        if (proxyObj) releaseLockedProxy(proxyObj);
        await new Promise((r) => setTimeout(r, 1000)); // 1s cooldown
      }
    }

    fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));

    if (created.length > 0) {
      const summary = created
        .map((acc, i) => `#${i + 1} ${acc.email} | ${acc.password}`)
        .join('\n');
      await ctx.reply(`✅ Created ${created.length} account(s):\n\n${summary}`);
    } else {
      await ctx.reply('❌ No accounts were created.');
    }
  });
};
