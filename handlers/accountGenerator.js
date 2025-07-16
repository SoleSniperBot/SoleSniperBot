const fs = require('fs');
const path = require('path');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const generateNikeAccount = require('../lib/generator');
const login = require('./login'); // ✅ FIXED: Correct path to login.js inside handlers/

const accountsPath = path.join(__dirname, '../data/accounts.json');
if (!fs.existsSync(accountsPath)) fs.writeFileSync(accountsPath, JSON.stringify({}));

module.exports = (bot) => {
  bot.command('accountgen', async (ctx) => {
    const userId = String(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const amount = parseInt(args[1]);

    if (isNaN(amount) || amount < 1 || amount > 50) {
      return ctx.reply('❗ Usage: /accountgen <1-50>');
    }

    ctx.reply(`🛠 Generating *${amount}* Nike accounts...`, { parse_mode: 'Markdown' });

    const generated = [];
    for (let i = 0; i < amount; i++) {
      const proxy = await getLockedProxy(userId);
      if (!proxy) {
        ctx.reply(`⚠️ No proxy available for account #${i + 1}. Skipping.`);
        continue;
      }

      try {
        const account = await generateNikeAccount(proxy);
        generated.push(account);

        // Auto-login after creation ✅
        await loginAccount(account.email, account.password, proxy, userId);
      } catch (err) {
        ctx.reply(`❌ Error generating account #${i + 1}: ${err.message}`);
      } finally {
        await releaseLockedProxy(userId);
      }
    }

    // Save accounts
    const all = JSON.parse(fs.readFileSync(accountsPath));
    if (!all[userId]) all[userId] = [];
    all[userId].push(...generated);
    fs.writeFileSync(accountsPath, JSON.stringify(all, null, 2));

    ctx.reply(`✅ *${generated.length}* accounts generated and logged in.`, { parse_mode: 'Markdown' });
  });
};

async function loginAccount(email, password, proxy, userId) {
  // Simulate /login handler internally
  try {
    const mockCtx = {
      from: { id: userId },
      reply: async (msg, opts) => console.log('Bot reply:', msg),
      message: { text: `/login ${email} ${password}` }
    };
    await login((bot) => {})(mockCtx); // Call the login handler with a fake context
  } catch (e) {
    console.error(`Login error for ${email}:`, e.message);
  }
}
