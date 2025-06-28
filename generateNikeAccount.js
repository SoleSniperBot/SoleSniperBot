const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const { lockRandomProxy } = require('./lib/proxyManager');

const accountsPath = path.join(__dirname, 'data/accounts.json');

let accounts = [];
if (fs.existsSync(accountsPath)) {
  accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
}

function saveAccounts() {
  fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
}

function generateEmail() {
  const names = ['mark', 'jay', 'chris', 'leo'];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const timestamp = Date.now();
  return `${randomName}${timestamp}@gmail.com`;
}

module.exports = async function generateNikeAccount(userId, bot) {
  const email = generateEmail();
  const password = `TempPass!${Math.floor(Math.random() * 10000)}`;

  const proxy = lockRandomProxy(userId);
  if (!proxy) throw new Error('No free proxies available.');

  const newAccount = { email, password, proxy, userId };
  accounts.push(newAccount);
  saveAccounts();

  // Send account with inline task controls
  await bot.telegram.sendMessage(
    userId,
    `👤 *Nike Account Generated:*\n📧 \`${email}\`\n🔑 \`${password}\`\n🔌 Proxy: \`${proxy}\``,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback(`🔁 Rotate Proxy (${email})`, `rotate_${email}`),
          Markup.button.callback(`🗑 Remove`, `remove_${email}`)
        ]
      ])
    }
  );

  return newAccount;
};
