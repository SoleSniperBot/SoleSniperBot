const fs = require('fs');
const path = require('path');
const { generateNikeAccount } = require('./accountGenerator');

const accountsPath = path.join(__dirname, '../data/accounts.json');

// Load existing accounts from file
function loadAccounts() {
  try {
    const data = fs.readFileSync(accountsPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return {}; // Return empty object if file doesn't exist
  }
}

// Save updated accounts to file
function saveAccounts(accounts) {
  fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
}

module.exports = (bot) => {
  bot.command('genaccount', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const userId = String(ctx.from.id);
    const numToGenerate = parseInt(args[0]);

    if (isNaN(numToGenerate) || numToGenerate < 1 || numToGenerate > 50) {
      return ctx.reply(`Please specify a number between 1 and 50.
Example: /genaccount 10`);
    }

    await ctx.reply(`Generating ${numToGenerate} Nike accounts...`);

    const accounts = loadAccounts();

    if (!accounts[userId]) {
      accounts[userId] = [];
    }

    for (let i = 0; i < numToGenerate; i++) {
      try {
        const result = await generateNikeAccount(userId);
        accounts[userId].push({
          email: result.email,
          password: result.password
        });
      } catch (err) {
        console.error(`Error generating account #${i + 1}:`, err.message);
        accounts[userId].push({ error: err.message || 'Unknown error' });
      }
    }

    saveAccounts(accounts);

    const successCount = accounts[userId].filter(acc => acc.email).length;
    return ctx.reply(`✅ Finished generating accounts.
Total: ${numToGenerate}, Success: ${successCount}`);
  });
};
