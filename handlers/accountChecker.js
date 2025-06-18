const fs = require('fs');
const path = require('path');
const loginNike = require('../lib/nikeLogin');

const accountsPath = path.join(__dirname, '../data/accounts.json');

module.exports = (bot) => {
  bot.command('checkaccounts', async (ctx) => {
    if (!fs.existsSync(accountsPath)) {
      return ctx.reply('❌ No accounts.json file found.');
    }

    const accounts = JSON.parse(fs.readFileSync(accountsPath));
    if (!accounts.length) {
      return ctx.reply('❌ No Nike accounts saved.');
    }

    ctx.reply(`🔍 Checking ${accounts.length} Nike account(s)... This may take a few minutes.`);

    for (const acc of accounts) {
      try {
        const status = await loginNike(acc);
        ctx.reply(`👟 ${acc.email} — ${status}`);
      } catch (err) {
        console.error(err);
        ctx.reply(`⚠️ ${acc.email} — Error during check`);
      }
    }
  });
};
