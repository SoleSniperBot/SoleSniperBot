const fs = require('fs');
const path = require('path');

const accountsPath = path.join(__dirname, '../data/accounts.json');

module.exports = (bot) => {
  // Slash command version
  bot.command('myaccounts', async (ctx) => {
    const userId = String(ctx.from.id);
    if (!fs.existsSync(accountsPath)) {
      return ctx.reply('❌ No accounts found.');
    }

    const allAccounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    const userAccounts = allAccounts.filter(acc => acc.userId === userId);

    if (userAccounts.length === 0) {
      return ctx.reply('❌ You haven’t generated any accounts yet.');
    }

    let output = `📁 Your Nike Accounts:\n\n`;

    userAccounts.forEach((a, i) => {
      output += `#${i + 1} 👤 Email: ${a.email}\n🔐 Pass: ${a.password}\n🌍 Proxy: ${a.proxy.ip}:${a.proxy.port}\n\n`;
    });

    await ctx.reply(output);
  });

  // Inline button version
  bot.action('viewaccounts', async (ctx) => {
    const userId = String(ctx.from.id);
    ctx.answerCbQuery();

    if (!fs.existsSync(accountsPath)) {
      return ctx.reply('❌ No accounts found.');
    }

    const allAccounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    const userAccounts = allAccounts.filter(acc => acc.userId === userId);

    if (userAccounts.length === 0) {
      return ctx.reply('❌ You haven’t generated any accounts yet.');
    }

    let output = `📁 Your Nike Accounts:\n\n`;

    userAccounts.forEach((a, i) => {
      output += `#${i + 1} 👤 Email: ${a.email}\n🔐 Pass: ${a.password}\n🌍 Proxy: ${a.proxy.ip}:${a.proxy.port}\n\n`;
    });

    await ctx.reply(output);
  });
};
