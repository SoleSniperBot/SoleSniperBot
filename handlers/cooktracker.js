// handlers/cooktracker.js
const fs = require('fs');
const path = require('path');

const statsPath = path.join(__dirname, '../data/stats.json');

module.exports = (bot) => {
  bot.command('cooktracker', async (ctx) => {
    const userId = String(ctx.from.id);

    if (!fs.existsSync(statsPath)) {
      return ctx.reply('📊 No cook data found.');
    }

    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    const userStats = stats[userId];

    if (!userStats) {
      return ctx.reply('🍽️ No successful checkouts found for your account yet.');
    }

    const totalPairs = userStats.successCount || 0;
    const moneySpent = userStats.estimatedSpent || 0;
    const title = userStats.title || 'Sniper';
    const heat = userStats.lastDrop || 'N/A';
    const date = userStats.lastDate || 'Unknown';

    const msg = `🍳 *Cook Tracker*\n\n` +
                `👟 Successful Checkouts: *${totalPairs}*\n` +
                `💷 Estimated Spent: *£${moneySpent}*\n` +
                `🏅 Status: *${title}*\n` +
                `🔥 Last Drop: *${heat}* (${date})`;

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  });
};
