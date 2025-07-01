const { Markup } = require('telegraf');
const { lockRandomProxy, releaseLockedProxy } = require('../lib/proxyManager');
const fs = require('fs');
const path = require('path');

const accountsPath = path.join(__dirname, '../data/accounts.json');
let accounts = fs.existsSync(accountsPath) ? JSON.parse(fs.readFileSync(accountsPath, 'utf8')) : [];

function saveAccounts() {
  fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
}

module.exports = (bot) => {
  bot.on('callback_query', async (ctx) => {
    const action = ctx.callbackQuery.data;
    const userId = ctx.from.id;

    // Expect format: rotate_email@example.com or remove_email@example.com
    const [command, ...emailParts] = action.split('_');
    const accountKey = emailParts.join('_'); // email might contain underscores

    const account = accounts.find(acc => acc.email === accountKey && acc.userId === userId);
    if (!account) return ctx.answerCbQuery('❌ Account not found.');

    if (command === 'rotate') {
      // Release old proxy
      if (account.proxy) {
        releaseLockedProxy(userId, account.proxy);
      }

      // Lock new proxy
      const newProxy = lockRandomProxy(userId);
      if (!newProxy) return ctx.reply('⚠️ No new proxy available to rotate.');

      account.proxy = newProxy;
      saveAccounts();

      await ctx.editMessageText(
        `👤 *Nike Account Updated:*\n📧 \`${account.email}\`\n🔑 \`${account.password}\`\n🔌 Proxy: \`${newProxy}\``,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(`🔁 Rotate Proxy`, `rotate_${account.email}`),
              Markup.button.callback(`🗑 Remove`, `remove_${account.email}`)
            ]
          ])
        }
      );

      return ctx.answerCbQuery('🔁 Proxy rotated.');
    }

    if (command === 'remove') {
      accounts = accounts.filter(a => !(a.email === account.email && a.userId === userId));
      saveAccounts();
      await ctx.editMessageText(`🗑 Removed account \`${account.email}\``, { parse_mode: 'Markdown' });
      return ctx.answerCbQuery('🗑 Account removed.');
    }
  });
};
