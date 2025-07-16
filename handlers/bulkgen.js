const fs = require('fs');
const path = require('path');
const { createNikeAccount } = require('../lib/nikeApi');
const { getNextEmail } = require('../lib/emailManager');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { checkSession } = require('../lib/sessionChecker');

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
      let proxy;
      try {
        proxy = await getLockedProxy(ctx.from.id);

        if (!proxy || typeof proxy !== 'string' || proxy.includes('undefined')) {
          await ctx.reply('❌ No valid proxy available at the moment.');
          break;
        }

        const email = await getNextEmail();
        const password = 'SoleSniper123!';

        const result = await createNikeAccount(email, password, proxy);

        if (!result || !result.success) {
          throw new Error(result?.error || 'Unknown failure');
        }

        const accountObj = {
          userId: String(ctx.from.id),
          email,
          password,
          proxy
        };

        storedAccounts.push(accountObj);
        generated.push(accountObj);

        await new Promise((res) => setTimeout(res, 1000));
      } catch (err) {
        await ctx.reply(`❌ Failed to generate account ${i + 1}: ${err.message}`);
      } finally {
        if (proxy) releaseLockedProxy(ctx.from.id);
      }
    }

    fs.writeFileSync(accountsPath, JSON.stringify(storedAccounts, null, 2));

    if (generated.length > 0) {
      const preview = generated.map((a, i) => {
        let ip = 'N/A', port = 'N/A', username = 'N/A', password = 'N/A';

        try {
          const clean = a.proxy.replace('http://', '').replace('https://', '');
          const parts = clean.split(/[:@]/);

          if (parts.length === 4) {
            [username, password, ip, port] = parts;
          } else if (parts.length === 3) {
            [ip, port, username] = parts;
          } else {
            [ip] = parts;
          }
        } catch (err) {
          // ignore, fallback to N/A
        }

        const session = checkSession(a.email);
        return `#${i + 1}
Email: ${a.email}
Password: ${a.password}
Proxy IP: ${ip}
Port: ${port}
Username: ${username}
Password: ${password}
Session: ${session}`;
      }).join('\n\n');

      await ctx.reply(`✅ Generated ${generated.length} account(s):\n\n${preview}`);
    } else {
      await ctx.reply('❌ No accounts were generated.');
    }
  });
};
