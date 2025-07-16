const fs = require('fs');
const path = require('path');
const { createNikeAccount } = require('../lib/nikeApi');
const { getNextEmail } = require('../lib/emailManager');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');

const accountsPath = path.join(__dirname, '../data/accounts.json');

module.exports = (bot) => {
  bot.command('bulkgen', async (ctx) => {
    const amount = parseInt(ctx.message.text.split(' ')[1]);
    if (!amount || amount < 1 || amount > 50) {
      return ctx.reply('⚠️ Usage: /bulkgen <1-50>');
    }

    await ctx.reply(`⏳ Creating ${amount} Nike account(s)...`);

    let accounts = fs.existsSync(accountsPath) ? JSON.parse(fs.readFileSync(accountsPath)) : [];
    const created = [];

    for (let i = 0; i < amount; i++) {
      let proxyObj;
      try {
        proxyObj = await getLockedProxy(ctx.from.id);
        const proxy = proxyObj?.formatted;

        if (!proxy || proxy.includes('undefined')) {
          await ctx.reply('❌ No valid proxy available.');
          break;
        }

        const email = await getNextEmail();
        const password = process.env.NIKE_PASS || 'SoleSniper123!';

        const result = await createNikeAccount(email, password, proxy);
        if (!result.success) throw new Error(result.error || 'Unknown error');

        accounts.push({ email, password, proxy });
        created.push({ email, proxy });

        await new Promise((res) => setTimeout(res, 1000)); // Delay to reduce bans
      } catch (err) {
        await ctx.reply(`❌ Failed account ${i + 1}: ${err.message}`);
      } finally {
        if (proxyObj) releaseLockedProxy(proxyObj);
      }
    }

    fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));

    if (created.length) {
      const summary = created.map((a, i) => {
        let ip = 'N/A', port = 'N/A';

        try {
          const clean = a.proxy?.replace(/^https?:\/\//, '');
          const parts = clean?.split(/[:@]/);
          if (parts?.length === 4) {
            [, , ip, port] = parts;
          } else if (parts?.length === 2) {
            [ip, port] = parts;
          }
        } catch {
          // fallback
        }

        return `#${i + 1} ✅ ${a.email}\nIP: ${ip} | Port: ${port}`;
      }).join('\n\n');

      await ctx.reply(`✅ Created ${created.length} account(s):\n\n${summary}`);
    } else {
      await ctx.reply('❌ No accounts were created.');
    }
  });
};
