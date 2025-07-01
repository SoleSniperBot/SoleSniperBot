const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  // Command: /cooktracker
  bot.command('cooktracker', async (ctx) => {
    const userId = ctx.from.id;
    const statsPath = path.join(__dirname, '../data/stats.json');
    let stats = {};
    if (fs.existsSync(statsPath)) {
      stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    }
    const userStats = stats[userId];

    if (!userStats) {
      return ctx.reply("👟 No cook data found yet. Use /checkout to start tracking!");
    }

    const msg = `📊 *Cook Tracker Summary*\n\n👤 User: ${ctx.from.username || 'Unknown'}\n✅ Successful Checkouts: ${userStats.checkouts}\n💷 Estimated Spent: £${userStats.spent}`;
    ctx.replyWithMarkdown(msg);
  });

  // Inline button handler: 'cooktracker'
  bot.action('cooktracker', async (ctx) => {
    await ctx.answerCbQuery();

    const userId = ctx.from.id;
    const statsPath = path.join(__dirname, '../data/stats.json');
    let stats = {};
    if (fs.existsSync(statsPath)) {
      stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    }
    const userStats = stats[userId];

    if (!userStats) {
      return ctx.reply("👟 No cook data found yet. Use /checkout to start tracking!");
    }

    const msg = `📊 *Cook Tracker Summary*\n\n👤 User: ${ctx.from.username || 'Unknown'}\n✅ Successful Checkouts: ${userStats.checkouts}\n💷 Estimated Spent: £${userStats.spent}`;
    ctx.replyWithMarkdown(msg);
  });
};
