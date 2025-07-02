const { lockRandomProxy, releaseLockedProxy } = require('../lib/proxyManager');
const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

const accountsPath = path.join(__dirname, '../data/accounts.json');
let accounts = fs.existsSync(accountsPath) ? JSON.parse(fs.readFileSync(accountsPath, 'utf8')) : [];

function saveAccounts() {
  fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
}

module.exports = (bot) => {
  bot.on('callback_query', async (ctx) => {
    const action = ctx.callbackQuery.data;
    const userId = ctx.from.id;
    const accountKey = action.split('_')[1];

    const account = accounts.find(acc => acc.email.includes(accountKey));
    if (!account || account.userId !== userId) return ctx.answerCbQuery('Account not found.');

    if (action.startsWith('rotate_')) {
      releaseLockedProxy(userId);
      const newProxy = lockRandomProxy(userId);
      if (!newProxy) return ctx.reply('⚠️ No new proxy available.');

      account.proxy = newProxy;
      saveAccounts();

      await ctx.editMessageText(
        `👤 *Nike Account Updated:*\n📧 \`${account.email}\`\n🔑 \`${account.password}\`\n🔌 Proxy: \`${newProxy}\``,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(`🔁 Rotate Proxy (${account.email})`, `rotate_${account.email}`),
              Markup.button.callback(`🗑 Remove`, `remove_${account.email}`)
            ]
          ])
        }
      );

      return ctx.answerCbQuery('🔁 Proxy rotated.');
    }

    if (action.startsWith('remove_')) {
      accounts = accounts.filter(a => a.email !== account.email);
      saveAccounts();
      await ctx.editMessageText(`🗑 Removed task for \`${account.email}\``, { parse_mode: 'Markdown' });
      return ctx.answerCbQuery('Task removed.');
    }
  });
};
