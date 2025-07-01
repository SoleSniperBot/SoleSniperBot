const fs = require('fs');
const path = require('path');
const generateNikeAccount = require('../generateNikeAccount'); // ✅ FIXED import

const accountsPath = path.join(__dirname, '../data/accounts.json');

// Load accounts from file
function loadAccounts() {
  try {
    return JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));
  } catch {
    return {};
  }
}

// Save accounts to file
function saveAccounts(accounts) {
  fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
}

module.exports = (bot) => {
  bot.command('genaccount', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const userId = String(ctx.from.id);
    const numToGenerate = parseInt(args[0]);

    if (isNaN(numToGenerate) || numToGenerate < 1 || numToGenerate > 50) {
      return ctx.reply(`⚠️ Please specify a number between 1 and 50.\nExample: /genaccount 10`);
    }

    await ctx.reply(`⏳ Generating ${numToGenerate} Nike account(s)...`);

    const accounts = loadAccounts();
    if (!accounts[userId]) accounts[userId] = [];

    for (let i = 0; i < numToGenerate; i++) {
      try {
        const result = await generateNikeAccount(); // No need to pass userId unless you're using it for proxy locking
        accounts[userId].push({
          email: result.email,
          password: result.password
        });
      } catch (err) {
        console.error(`❌ Error generating account #${i + 1}:`, err.message);
        accounts[userId].push({ error: err.message || 'Unknown error' });
      }
    }

    saveAccounts(accounts);

    const successCount = accounts[userId].filter(acc => acc.email).length;
    return ctx.reply(`✅ Finished.\nTotal: ${numToGenerate}\nSuccess: ${successCount}`);
  });
};
