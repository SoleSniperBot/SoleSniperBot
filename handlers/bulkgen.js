const fs = require('fs');
const path = require('path');
const { createNikeAccount } = require('./accountGenerator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const emailPool = require('../lib/emailPool');

module.exports = (bot) => {
  bot.command('bulkgen', async (ctx) => {
    const userId = String(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const count = parseInt(args[1]);

    if (!count || count < 1 || count > 50) {
      return ctx.reply('❌ Invalid usage. Example: /bulkgen 5');
    }

    ctx.reply(`⏳ Creating ${count} Nike account(s)...`);

    const results = [];
    for (let i = 0; i < count; i++) {
      const email = emailPool.getEmail();
      if (!email) {
        results.push(`❌ Failed account ${i + 1}: No email available.`);
        continue;
      }

      const proxy = await getLockedProxy(userId);
      if (!proxy) {
        results.push(`❌ Failed account ${i + 1}: No proxy available.`);
        continue;
      }

      try {
        const result = await generateNikeAccount(email, 'SoleSniper123!', proxy);
        results.push(`✅ Account ${i + 1}: ${result.email}`);
      } catch (err) {
        results.push(`❌ Failed account ${i + 1}: ${err.message}`);
      }

      await releaseLockedProxy(userId, proxy);
    }

    const success = results.filter(r => r.startsWith('✅')).length;
    const failed = results.length - success;

    ctx.reply(
      `✅ Created ${success}/${count} accounts.\n\n` +
      results.slice(0, 20).join('\n') +
      (results.length > 20 ? `\n...and ${results.length - 20} more` : '')
    );
  });
};
