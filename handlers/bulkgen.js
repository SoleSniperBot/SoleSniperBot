const fs = require('fs');
const path = require('path');
const generateNikeAccount = require('../generateNikeAccount');
const { lockRandomProxy } = require('../lib/proxyManager');

const accountsPath = path.join(__dirname, '../data/accounts.json');

// Ensure accounts.json exists
if (!fs.existsSync(accountsPath)) {
  fs.writeFileSync(accountsPath, JSON.stringify([]));
}

module.exports = (bot) => {
  bot.command('bulkgen', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const amount = parseInt(args[1]);

    if (isNaN(amount) || amount < 1 || amount > 100) {
      return ctx.reply('❌ Usage: /bulkgen <amount> (1–100)');
    }

    await ctx.reply(`⚙️ Generating ${amount} Nike account(s)...`);

    const userId = ctx.from.id;
    const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    const results = [];

    for (let i = 0; i < amount; i++) {
      const account = await generateNikeAccount();
      const proxy = getLockedProxy(userId);

      if (!proxy) {
        await ctx.reply(`❌ Ran out of proxies after ${i} accounts.`);
        break;
      }

      const record = {
        email: account.email,
        password: account.password,
        proxy: proxy.ip,
        userId,
        timestamp: new Date().toISOString()
      };

      accounts.push(record);
      results.push(`${record.email}:${record.password}:${record.proxy}`);
    }

    // Save accounts to file
    fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));

    // Write result to .txt file
    const tempPath = path.join(__dirname, `../data/generated_${userId}.txt`);
    fs.writeFileSync(tempPath, results.join('\n'));

    await ctx.replyWithDocument({ source: tempPath, filename: `nike_accounts.txt` });
    fs.unlinkSync(tempPath); // Clean up
  });
};
