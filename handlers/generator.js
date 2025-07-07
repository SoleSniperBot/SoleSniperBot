const { generateNikeAccount } = require('../lib/generator');
const fs = require('fs');
const path = require('path');

const accountsPath = path.join(__dirname, '../data/accounts.json');

module.exports = (bot) => {
  async function runGen(ctx, amount) {
    const userId = ctx.from.id;
    await ctx.reply(`⚡ Starting generation of ${amount} account(s)...`);

    const generated = [];

    for (let i = 0; i < amount; i++) {
      try {
        const account = await generateNikeAccount(userId);
        generated.push(account);
      } catch (err) {
        console.error(`❌ Failed to generate account ${i + 1}:`, err.message);
      }
    }

    if (generated.length > 0) {
      let existing = [];
      if (fs.existsSync(accountsPath)) {
        existing = JSON.parse(fs.readFileSync(accountsPath));
      }
      const updated = [...existing, ...generated];
      fs.writeFileSync(accountsPath, JSON.stringify(updated, null, 2));

      const textDump = generated.map(acc => `${acc.email}:${acc.password}`).join('\n');
      await ctx.replyWithDocument({ source: Buffer.from(textDump), filename: `gen_${amount}.txt` });
    } else {
      await ctx.reply('⚠️ No accounts generated. Check proxy or IMAP settings.');
    }
  }

  bot.command('gen5', (ctx) => runGen(ctx, 5));
  bot.command('gen10', (ctx) => runGen(ctx, 10));
  bot.command('gen25', (ctx) => runGen(ctx, 25));
};
