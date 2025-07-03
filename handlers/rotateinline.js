// handlers/rotateinline.js
const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const generateNikeAccount = require('../lib/generator');
const { lockRandomProxy, releaseLockedProxy } = require('../lib/proxyManager');

const accountsPath = path.join(__dirname, '../data/accounts.json');

module.exports = (bot) => {
  bot.action('rotategen', async (ctx) => {
    const userId = String(ctx.from.id);
    await ctx.answerCbQuery();
    await ctx.reply('🔄 Rotating proxy and generating Nike account...');

    const tempKey = `${userId}_rotate_one`;
    const proxy = lockRandomProxy(tempKey);

    if (!proxy) {
      await ctx.reply('❌ No available proxies. Upload more with /proxies or button.');
      return;
    }

    try {
      const account = await generateNikeAccount(proxy);
      releaseLockedProxy(tempKey);

      // Save account
      const storedAccounts = fs.existsSync(accountsPath)
        ? JSON.parse(fs.readFileSync(accountsPath, 'utf8'))
        : [];

      const newAccount = {
        userId,
        email: account.email,
        password: account.password,
        proxy
      };

      storedAccounts.push(newAccount);
      fs.writeFileSync(accountsPath, JSON.stringify(storedAccounts, null, 2));

      // Reply to user with account + proxy info
      const preview = `✅ 1 Account Generated\n\n👤 Email: ${account.email}\n🔐 Password: ${account.password}\n🌍 Proxy: ${proxy.ip}:${proxy.port}`;
      await ctx.reply(preview, Markup.inlineKeyboard([
        [Markup.button.callback('🔁 Generate Another', 'rotategen')],
        [Markup.button.callback('📁 View Accounts', 'viewaccounts')]
      ]));

    } catch (err) {
      releaseLockedProxy(tempKey);
      await ctx.reply(`❌ Generation failed: ${err.message}`);
    }
  });
};
