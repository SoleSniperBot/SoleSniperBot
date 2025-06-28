const { getUserProxies, getLockedProxy, lockRandomProxy, releaseLockedProxy } = require('../lib/proxyManager');

module.exports = (bot) => {
  bot.action('rotate_proxy', async (ctx) => {
    const userId = ctx.from.id;

    // Release current lock if any
    releaseLockedProxy(userId);

    // Lock a new one
    const newProxy = lockRandomProxy(userId);

    if (newProxy) {
      await ctx.reply(`🔁 New proxy locked:\n\`${newProxy}\``, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply('⚠️ No available proxies to rotate.');
    }

    ctx.answerCbQuery();
  });
};
