const generateNikeAccount = require('../lib/generateNikeAccount');

module.exports = (bot) => {
  bot.command('genaccount', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
      return ctx.reply('❗ Usage: /genaccount email@example.com password123');
    }

    const email = args[1];
    const password = args[2];

    try {
      await ctx.reply('🔄 Generating Nike account...');
      const account = await generateNikeAccount(email, password);
      await ctx.reply(
        `✅ Account generated!\nEmail: ${account.email}\nPassword: ${account.password}`
      );
    } catch (err) {
      await ctx.reply('❌ Failed to generate account: ' + err.message);
    }
  });
};
