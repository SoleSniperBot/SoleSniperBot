// handlers/gen.js
const { generateNikeAccount } = require('../lib/generator');

module.exports = (bot) => {
  bot.command('gen', async (ctx) => {
    await ctx.reply('⚙️ Generating 1 Nike account...');

    try {
      const account = await generateNikeAccount(ctx.from.id);
      await ctx.reply(`✅ Account created:\n📧 ${account.email}\n👤 ${account.name}`);
    } catch (err) {
      console.error('Account generation error:', err.message);
      await ctx.reply('❌ Account generation failed. Check proxy, IMAP, or retry.');
    }
  });
};
