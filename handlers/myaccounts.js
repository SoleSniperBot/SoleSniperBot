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

    const latest = userAccounts.slice(-5).reverse(); // Show last 5
    const formatted = latest.map((acc, i) =>
      `*#${i + 1}*\n` +
      `📧 *Email:* \`${acc.email}\`\n` +
      `🔑 *Pass:* \`${acc.password}\`\n` +
      `👤 *Name:* ${acc.firstName} ${acc.lastName}`
    ).join('\n\n');

    ctx.replyWithMarkdown(`📂 *Your Last ${latest.length} Nike Accounts:*\n\n${formatted}`);
  });
};
