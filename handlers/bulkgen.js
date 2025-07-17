const { generateNikeAccount } = require('../lib/generateNikeAccount');

module.exports = (bot) => {
  bot.command('bulkgen', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const count = parseInt(args[1]) || 1;
    const userId = ctx.from.id;

    await ctx.reply(`⏳ Creating ${count} Nike account(s)...`);

    const results = [];

    for (let i = 0; i < count; i++) {
      const result = await generateNikeAccount(userId, i + 1);
      if (result.success) {
        results.push(`✅ ${result.email} | ${result.password}`);
      }
    }

    if (results.length === 0) {
      await ctx.reply('❌ No accounts were created.');
    } else {
      await ctx.reply(results.join('\n'));
    }
  });
};
