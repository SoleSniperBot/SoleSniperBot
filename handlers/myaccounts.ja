const fs = require('fs');
const path = require('path');

const accountsPath = path.join(__dirname, '../data/accounts.json');

module.exports = (bot) => {
  bot.command('myaccounts', (ctx) => {
    const userId = String(ctx.from.id);

    if (!fs.existsSync(accountsPath)) {
      return ctx.reply('⚠️ No accounts generated yet.');
    }

    const allAccounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    const userAccounts = allAccounts.filter(acc => acc.userId === userId);

    if (userAccounts.length === 0) {
      return ctx.reply('📂 You have no generated accounts yet.');
    }

    let reply = `📂 *Your Generated Nike Accounts*:\n\n`;

    userAccounts.forEach((acc, i) => {
      reply += `#${i + 1}\nEmail: ${acc.email}\nPassword: ${acc.password}\nProxy: ${acc.proxy}\n\n`;
    });

    ctx.reply(reply, { parse_mode: 'Markdown' });
  });
};
