const { generateNikeAccount } = require('../lib/nikeAccountGenerator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');

module.exports = (bot) => {
  bot.command('genmenu', async (ctx) => {
    const buttons = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📲 Generate Nike Account', callback_data: 'generate_nike' }]
        ]
      }
    };
    await ctx.reply('Choose an action:', buttons);
  });

  bot.action('generate_nike', async (ctx) => {
    const userId = ctx.from.id;
    const proxy = getLockedProxy(userId);

    if (!proxy) {
      return ctx.reply('❌ No available proxies. Try again later.');
    }

    try {
      await ctx.answerCbQuery('🛠 Generating Nike account...');
      const account = await generateNikeAccount(proxy, ctx);

      if (account && account.email) {
        await ctx.reply(`✅ Account created:\n📧 ${account.email}\n🔐 ${account.password}`);
      } else {
        await ctx.reply('❌ Account creation failed. Check logs.');
      }
    } catch (err) {
      console.error(`❌ Error generating Nike account: ${err.message}`);
      await ctx.reply('❌ Generation failed. Check logs.');
    } finally {
      releaseLockedProxy(userId);
    }
  });
};
