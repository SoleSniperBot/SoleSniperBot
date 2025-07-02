const fs = require('fs');
const path = require('path');
const generateNikeAccount = require('../lib/generator');
const {
  lockRandomProxy,
  releaseLockedProxy
} = require('../lib/proxyManager');

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
      const tempKey = `${ctx.from.id}_${i}`;
      const proxy = lockRandomProxy(tempKey);

      if (!proxy) {
        await ctx.reply(`❌ No available proxies. Please upload more using the 'Send Proxies' button.`);
        break;
      }

      try {
        // Log full proxy object clearly
        console.log('👟 Generated account with proxy:', JSON.stringify(proxy, null, 2));

        const account = await generateNikeAccount(proxy);

        releaseLockedProxy(tempKey);
        lockRandomProxy(account.email); // optional re-lock for further ops

        const accountObj = {
          userId: String(ctx.from.id),
          email: account.email,
          password: account.password,
          proxy
        };

        storedAccounts.push(accountObj);
        generated.push(accountObj);

        await new Promise((res) => setTimeout(res, 1000)); // delay for realism
      } catch (err) {
        releaseLockedProxy(tempKey);
        await ctx.reply(`❌ Failed to generate account ${i + 1}: ${err.message}`);
      }
    }

    fs.writeFileSync(accountsPath, JSON.stringify(storedAccounts, null, 2));

    if (generated.length > 0) {
      const preview = generated.map((a, i) => {
        const proxy = a.proxy || {};
        return `#${i + 1}
Email: ${a.email}
Password: ${a.password}
Proxy IP: ${proxy.ip || 'N/A'}
Port: ${proxy.port || 'N/A'}
Username: ${proxy.username || 'N/A'}
Password: ${proxy.password || 'N/A'}
Country: ${proxy.country || 'N/A'}
`;
      }).join('\n');

      await ctx.reply(`✅ Generated ${generated.length} account(s):\n\n${preview}`);
    } else {
      await ctx.reply('❌ No accounts were generated.');
    }
  });
};
