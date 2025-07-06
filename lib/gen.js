const generateNikeAccount = require('../lib/generator');

module.exports = (bot) => {
  bot.command('gen', async (ctx) => {
    await ctx.reply('⚙️ Generating 1 Nike account...');
    try {
      const account = await generateNikeAccount();
      await ctx.reply(`✅ Account created:\n\n📧 ${account.email}\n👤 ${account.firstName} ${account.lastName}`);
    } catch (err) {
      await ctx.reply('❌ Account generation failed. Try again later.');
    }
  });
};
