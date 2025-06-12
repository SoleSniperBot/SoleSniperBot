// handlers/cooktracker.js
const fs = require('fs');
const path = require('path');

const statsPath = path.join(__dirname, '../data/stats.json');

if (!fs.existsSync(statsPath)) {
  fs.writeFileSync(statsPath, JSON.stringify({}));
}

let stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));

module.exports = (bot) => {
  bot.command('cooktracker', (ctx) => {
    const userId = ctx.from.id;

    const userStats = stats[userId];
    if (!userStats) {
      return ctx.reply("👟 No cook data found yet. Use /checkout to start tracking!");
    }

    const msg = `📊 *Cook Tracker Summary*\n\n👤 User: ${ctx.from.username || 'Unknown'}\n✅ Successful Checkouts: ${userStats.checkouts}\n💷 Estimated Spent: £${userStats.spent}`;
    ctx.replyWithMarkdown(msg);
  });
};
