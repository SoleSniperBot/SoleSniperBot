const fs = require('fs');
const path = require('path');
const { fetchNike2FA } = require('../lib/imap');
const names = require('../lib/names.json');
const proxies = require('../lib/proxies.json');
const accountsPath = path.join(__dirname, '../data/accounts.json');

// Helper to pick random name
function getRandomName() {
  const name = names[Math.floor(Math.random() * names.length)];
  const [first, last] = name.split(' ');
  return { first, last };
}

// Helper to pick random proxy
function getRandomProxy() {
  return proxies[Math.floor(Math.random() * proxies.length)];
}

// Email trick using Gmail
function generateEmail(first, last) {
  const rand = Math.floor(Math.random() * 10000);
  return `${first.toLowerCase()}.${last.toLowerCase()}+${rand}@gmail.com`;
}

module.exports = (bot) => {
  bot.command('bulkgen', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const count = parseInt(args[0]);

    if (isNaN(count) || count < 1 || count > 50) {
      return ctx.reply('Please specify a number between 1 and 50. Example: /genaccount 10');
    }

    await ctx.reply(`Generating ${count} Nike accounts...`);

    const generated = [];

    for (let i = 0; i < count; i++) {
      const { first, last } = getRandomName();
      const proxy = getRandomProxy();
      const email = generateEmail(first, last);
      const password = 'SecurePass123!'; // Or make dynamic
      const account = {
        email,
        password,
        first,
        last,
        proxy
      };

      // Simulate 2FA handling
      try {
        const code = await fetchNike2FA(email);
        account.verificationCode = code || 'N/A';
      } catch {
        account.verificationCode = 'ERROR';
      }

      generated.push(account);
    }

    // Save accounts
    fs.writeFileSync(accountsPath, JSON.stringify(generated, null, 2));
    await ctx.replyWithDocument({ source: accountsPath, filename: 'nike_accounts.json' });
  });
};
