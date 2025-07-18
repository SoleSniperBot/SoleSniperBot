// handlers/bulkgen.js
const fs = require('fs');
const path = require('path');
const generateNikeAccount = require('../lib/generateNikeAccount'); // the module you just updated
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');

const accountsPath = path.join(__dirname, '../data/accounts.json');

module.exports = (bot) => {
  bot.command('bulkgen', async (ctx) => {
    const parts = ctx.message.text.trim().split(' ');
    const count = parseInt(parts[1], 10);

    if (!count || count < 1 || count > 50) {
      return ctx.reply('⚠️ Usage: /bulkgen <1–50>');
    }

    await ctx.reply(`⏳ Generating *${count}* Nike account(s)...`, { parse_mode: 'Markdown' });

    // load or init storage
    const stored = fs.existsSync(accountsPath)
      ? JSON.parse(fs.readFileSync(accountsPath, 'utf8'))
      : [];

    const results = [];

    for (let i = 0; i < count; i++) {
      // Lock a proxy
      let proxy;
      try {
        proxy = await getLockedProxy(ctx.from.id);
      } catch (e) {
        await ctx.reply(`❌ Failed to fetch proxy for #${i+1}: ${e.message}`);
        break;
      }

      if (!proxy || !proxy.formatted) {
        await ctx.reply(`❌ No proxies left for #${i+1}.`);
        break;
      }

      try {
        // generateNikeAccount handles email rotation + fallback internally
        const account = await generateNikeAccount(ctx.from.id);

        if (!account) {
          throw new Error('Generation returned no account object');
        }

        // account = { email, password, firstName, lastName, proxy: proxy.formatted }
        stored.push(account);
        results.push(account);

      } catch (err) {
        await ctx.reply(`❌ Failed #${i+1}: ${err.message}`);
      } finally {
        // always release lock even on error
        await releaseLockedProxy(ctx.from.id);
      }
    }

    // persist
    fs.writeFileSync(accountsPath, JSON.stringify(stored, null, 2));

    if (results.length > 0) {
      const preview = results.map((a, idx) => {
        return `*#${idx + 1}*  
📧 ${a.email}  
🔑 ${a.password}  
🌍 ${a.proxy}`;  
      }).join('\n\n');

      await ctx.reply(`✅ Generated *${results.length}* account(s):\n\n${preview}`, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply('❌ No accounts were generated.');
    }
  });
};
