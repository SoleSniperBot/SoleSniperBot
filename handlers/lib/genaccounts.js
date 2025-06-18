const fs = require('fs');
const path = require('path');
const { generateNikeAccounts } = require('../lib/accountGenerator');

const accountsPath = path.join(__dirname, '../data/accounts.json');

module.exports = (bot) => {
  bot.command('genaccounts', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const count = parseInt(args[1]);

    if (!count || isNaN(count) || count < 1 || count > 15) {
      return ctx.reply('❗ Usage: /genaccounts <1–15>\nExample: `/genaccounts 5`', { parse_mode: 'Markdown' });
    }

    await ctx.reply(`🧪 Generating ${count} Nike account(s)... Please wait...`);

    try {
      const { accounts, failed } = await generateNikeAccounts(count, ctx.from.id);

      if (accounts.length === 0) {
        return ctx.reply('❌ All account generation attempts failed. Try again later with fresh proxies.');
      }

      let msg = `✅ Created ${accounts.length} Nike account(s):\n\n`;
      accounts.forEach((acc, i) => {
        msg += `${i + 1}. ${acc.email} : ${acc.password}\n`;
      });

      if (failed > 0) msg += `\n⚠️ ${failed} attempt(s) failed due to proxy or signup error.`;

      ctx.reply(msg);
    } catch (err) {
      console.error('Account generation error:', err);
      ctx.reply('❌ Failed to generate accounts. Try again later.');
    }
  });
};
