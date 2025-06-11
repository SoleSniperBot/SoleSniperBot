const fs = require('fs');
const path = require('path');

const statsPath = path.join(__dirname, '..', 'Data', 'Stats.json');

function getStats() {
  if (!fs.existsSync(statsPath)) {
    return {};
  }
  const raw = fs.readFileSync(statsPath);
  return JSON.parse(raw);
}

function saveStats(stats) {
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

function recordCheckout(userId, amount = 200) {
  const stats = getStats();
  const userStats = stats[userId] || {
    checkouts: 0,
    spent: 0
  };
  userStats.checkouts += 1;
  userStats.spent += amount;
  stats[userId] = userStats;
  saveStats(stats);
}

function getStatus(checkouts) {
  if (checkouts >= 10) return 'GOAT 🐐';
  if (checkouts === 9) return 'Legend';
  if (checkouts === 8) return 'Hall of Fame 🔥';
  if (checkouts === 7) return 'Real OG Sniper 😎';
  if (checkouts === 6) return 'Snipe-Demon 😈';
  if (checkouts === 5) return 'I put 5 on it 🎵';
  if (checkouts === 4) return 'Getting sturdy 🕺🏾';
  if (checkouts === 3) return '3’s a crowd 👟👟👟🔥';
  if (checkouts === 2) return 'Double Bubble 🫧';
  if (checkouts === 1) return 'Got em';
  return '👀';
}

function handleStats(bot) {
  bot.command('stats', (ctx) => {
    const stats = getStats();
    const userId = ctx.from.id;
    const userStats = stats[userId];

    if (!userStats) {
      return ctx.reply('No cook history found for you yet 🍞');
    }

    const status = getStatus(userStats.checkouts);

    ctx.replyWithMarkdown(
      `*Cook Tracker*\n\n✅ Successful Checkouts: *${userStats.checkouts}*\n💸 Money Spent: *£${userStats.spent}*\n🎖 Status: *${status}*`
    );
  });
}

module.exports = {
  handleStats,
  recordCheckout
};
