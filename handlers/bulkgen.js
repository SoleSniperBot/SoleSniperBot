const accountGenerator = require('./accountGenerator');

module.exports = (bot) => {
  bot.command('bulkgen', async (ctx) => {
    const userId = String(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const count = parseInt(args[1]) || 5;

    if (count > 15) return ctx.reply('❌ Max 15 accounts per batch allowed.');

    ctx.reply(`🔄 Starting generation of ${count} Nike accounts...`);

    let success = 0;
    let fails = 0;

    for (let i = 0; i < count; i++) {
      const result = await generateNikeAccount(userId);
      if (result.success) {
        success++;
        await ctx.reply(`✅ Account ${success}: 
📧 ${result.email}
🔑 ${result.password}`);
      } else {
        fails++;
        await ctx.reply(`❌ Error: ${result.message}`);
      }
    }

    ctx.reply(`✅ Done: ${success} created | ❌ ${fails} failed.`);
  });
};
