const generateNikeAccount = require('../lib/accountGenerator');

module.exports = (bot) => {
  bot.command('genaccount', async (ctx) => {
    const userId = ctx.from.id;

    await ctx.reply('⚙️ Generating a new Nike account... This may take 10–20 seconds.');

    try {
      const result = await generateNikeAccount(userId);
      if (result.success) {
        ctx.reply(`✅ Account Created: \`${result.email} / ${result.password}\``, { parse_mode: 'Markdown' });
      } else {
        ctx.reply(`❌ Failed: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      ctx.reply(`❌ Error: ${err.message}`);
    }
  });
};
