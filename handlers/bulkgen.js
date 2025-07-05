const fs = require('fs');
const path = require('path');
const generateNikeAccount = require('../lib/generator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');

const accountsPath = path.join(__dirname, '../data/accounts.json');

module.exports = (bot) => {
  bot.command('bulkgen', async (ctx) => {
    const input = ctx.message.text.split(' ')[1];
    const count = parseInt(input);

    if (!count || count < 1 || count > 50) {
      return ctx.reply('⚠️ Usage: /bulkgen <1-50>');
    }

    await ctx.reply(`⏳ Generating ${count} Nike account(s)...`);

    let storedAccounts = fs.existsSync(accountsPath)
      ? JSON.parse(fs.readFileSync(accountsPath, 'utf8'))
      : [];

    const generated = [];

    for (let i = 0; i < count; i++) {
      try {
        const proxy = await getLockedProxy(ctx.from.id);
        if (!proxy || proxy.includes('undefined')) {
          await ctx.reply('❌ No valid proxy available at the moment.');
          break;
        }

        const account = await generateNikeAccount(proxy, ctx);

        const accountObj = {
          userId: String(ctx.from.id),
          email: account.email,
          password: account.password,
          proxy
        };

        storedAccounts.push(accountObj);
        generated.push(accountObj);

        await new Promise((res) => setTimeout(res, 1000)); // small delay
      } catch (err) {
        await ctx.reply(`❌ Failed to generate account ${i + 1}: ${err.message}`);
      } finally {
        releaseLockedProxy(ctx.from.id);
      }
    }

    fs.writeFileSync(accountsPath, JSON.stringify(storedAccounts, null, 2));

    if (generated.length > 0) {
      const preview = generated.map((a, i) => {
        const [ip, port, username, password] = (a.proxy || '').split(':');
        return `#${i + 1}
Email: ${a.email}
Password: ${a.password}
Proxy IP: ${ip || 'N/A'}
Port: ${port || 'N/A'}
Username: ${username || 'N/A'}
Password: ${password || 'N/A'}\n`;
      }).join('\n');

      await ctx.reply(`✅ Generated ${generated.length} account(s):\n\n${preview}`);
    } else {
      await ctx.reply('❌ No accounts were generated.');
    }
  });
};
