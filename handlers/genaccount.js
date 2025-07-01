const fs = require('fs');
const path = require('path');
const generateNikeAccount = require('../generateNikeAccount');
const { lockRandomProxy, releaseLockedProxy } = require('../lib/proxyManager');

const accountsPath = path.join(__dirname, '../data/accounts.json');

module.exports = (bot) => {
  bot.command('genaccount', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const userId = String(ctx.from.id);
    const count = parseInt(args[0]);

    if (isNaN(count) || count < 1 || count > 10) {
      return ctx.reply('⚠️ Usage: /genaccount <1-10>');
    }

    await ctx.reply(`⏳ Generating ${count} Nike account(s)...`);

    let accounts = {};
    if (fs.existsSync(accountsPath)) {
      accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));
    }

    if (!accounts[userId]) accounts[userId] = [];

    const generated = [];

    for (let i = 0; i < count; i++) {
      const lockKey = `${userId}_gen_${i}`;
      const proxy = lockRandomProxy(lockKey);

      if (!proxy) {
        await ctx.reply('❌ No available proxies. Tap "Fetch Proxies" and try again.');
        break;
      }

      try {
        const account = await generateNikeAccount(proxy);
        releaseLockedProxy(lockKey);
        lockRandomProxy(account.email); // lock under email for future use

        accounts[userId].push({
          email: account.email,
          password: account.password,
          proxy: account.proxy
        });

        generated.push(account);
        await new Promise((res) => setTimeout(res, 1000));
      } catch (err) {
        releaseLockedProxy(lockKey);
        console.error(`Generation error #${i + 1}:`, err.message);
        accounts[userId].push({ error: err.message });
      }
    }

    fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));

    if (generated.length > 0) {
      const summary = generated.map((a, i) =>
        `#${i + 1} - ${a.email} | ${a.password} | ${a.proxy}`
      ).join('\n');

      await ctx.reply(`✅ Generated ${generated.length} account(s):\n\n\`\`\`\n${summary}\n\`\`\``, {
        parse_mode: 'Markdown'
      });
    } else {
      await ctx.reply('❌ No accounts were generated.');
    }
  });
};
