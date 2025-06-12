const vipUsers = require('./webhook').vipUsers;

module.exports = (bot) => {
  bot.command('checkout', (ctx) => {
    const userId = ctx.from.id;

    if (!vipUsers.has(userId)) {
      return ctx.reply('🚫 This feature is available for VIP members only. Please upgrade to access.');
    }

    ctx.reply('💸 Starting checkout process...');
    // Your full checkout logic here...
  });
};
