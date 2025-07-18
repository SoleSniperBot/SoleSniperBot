const { generateNikeAccount } = require('../lib/generateNikeAccount');
const fs = require('fs');
const path = require('path');

const accountsPath = path.join(__dirname, '../data/accounts.json');
if (!fs.existsSync(accountsPath)) fs.writeFileSync(accountsPath, JSON.stringify([]));

module.exports = (bot) => {
  bot.command('bulkgen', async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const amount = parseInt(args[1]) || 1;

    if (amount > 50) return ctx.reply('❌ Max is 50 accounts per batch.');
    ctx.reply(`⚙️ Generating ${amount} Nike accounts...`);

    const results = [];
    for (let i = 0; i < amount; i++) {
      const result = await generateNikeAccount(userId, i);
      if (result.success) {
        results.push({ email: result.email, password: result.password });
      }
    }

    if (results.length === 0) {
      return ctx.reply('❌ No accounts generated. Check logs.');
    }

    // Save to accounts.json
    const existing = JSON.parse(fs.readFileSync(accountsPath));
    const combined = [...existing, ...results];
    fs.writeFileSync(accountsPath, JSON.stringify(combined, null, 2));

    // Send results in Telegram
    let output = `✅ ${results.length} Nike Accounts:\n\n`;
    for (const acc of results) {
      output += `${acc.email} | ${acc.password}\n`;
    }

    ctx.reply(output);
  });
};
