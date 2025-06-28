const fs = require('fs');
const path = require('path');
const generateNikeAccount = require('../generateNikeAccount');
const {
  lockRandomProxy,
  releaseLockedProxy
} = require('../proxyManager');

const accountsPath = path.join(__dirname, '../data/accounts.json');
if (!fs.existsSync(accountsPath)) fs.writeFileSync(accountsPath, '[]');

module.exports = (bot) => {
  bot.command('bulkgen', async (ctx) => {
    const parts = ctx.message.text.split(' ');
    const amount = parseInt(parts[1]);

    if (isNaN(amount) || amount < 1 || amount > 100) {
      return ctx.reply('⚠️ Please use the command like this:\n`/bulkgen 10`', { parse_mode: 'Markdown' });
    }

    await ctx.reply(`🔄 Generating ${amount} Nike account(s)... This may take a few moments.`);

    const accounts = [];
    for (let i = 0; i < amount; i++) {
      try {
        const account = await generateNikeAccount();

        // Lock a proxy for this account email
        const proxy = lockRandomProxy(account.email);
        if (!proxy) {
          await ctx.reply(`❌ No proxies left to assign for account ${account.email}`);
          continue;
        }

        account.proxy = proxy;
        accounts.push(account);
      } catch (err) {
        await ctx.reply(`❌ Error generating account ${i + 1}: ${err.message}`);
      }
    }

    // Save to accounts.json
    const existing = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    const combined = existing.concat(accounts);
    fs.writeFileSync(accountsPath, JSON.stringify(combined, null, 2));

    // Format results
    const output = accounts.map(acc => `Email: ${acc.email}\nPass: ${acc.password}\nProxy: ${acc.proxy}\n`).join('\n');
    const outputPath = path.join(__dirname, '../data/generated.txt');
    fs.writeFileSync(outputPath, output);

    // Send file back to user
    await ctx.replyWithDocument({ source: outputPath, filename: 'generated_accounts.txt' });

    if (accounts.length === 0) {
      await ctx.reply('❌ No accounts were generated.');
    } else {
      await ctx.reply(`✅ ${accounts.length} account(s) generated and assigned proxies.`);
    }
  });
};
