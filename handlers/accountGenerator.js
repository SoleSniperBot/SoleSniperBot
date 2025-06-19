const fs = require('fs');
const path = require('path');
const { generateNikeAccount } = require('./accountGenerator'); // If you're calling this file from elsewhere

module.exports = (bot) => {
  bot.command('genaccount', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const userId = ctx.from.id;

    const numToGenerate = parseInt(args[0]);

    if (isNaN(numToGenerate) || numToGenerate < 1 || numToGenerate > 50) {
      return ctx.reply(`Please specify a number between 1 and 50.
Example: /genaccount 10`);
    }

    ctx.reply(`Starting account generation for ${numToGenerate} accounts...`);

    const results = [];

    for (let i = 0; i < numToGenerate; i++) {
      try {
        const result = await generateNikeAccount(userId);
        results.push(`${result.email} / ${result.password}`);
      } catch (err) {
        console.error(`Failed to generate account #${i + 1}`, err);
        results.push(`Error: ${err.message || 'Unknown error'}`);
      }
    }

    const finalOutput = results.join('\n');

    fs.writeFileSync(
      path.join(__dirname, `../data/generated_accounts_${userId}.txt`),
      finalOutput
    );

    ctx.replyWithDocument({
      source: fs.readFileSync(
        path.join(__dirname, `../data/generated_accounts_${userId}.txt`)
      ),
      filename: `accounts_${userId}.txt`
    });
  });
};
