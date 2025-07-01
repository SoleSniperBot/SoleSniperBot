// handlers/leaderboard.js
const fs = require('fs');
const path = require('path');

const statsPath = path.join(__dirname, '../data/stats.json');

if (!fs.existsSync(statsPath)) {
  fs.writeFileSync(statsPath, JSON.stringify({}));
}

const titles = {
  1: 'Got em',
  2: 'Double Bubble 🫧',
  3: '3’s a crowd 👟👟👟🔥',
  4: 'Getting sturdy 🕺🏾',
  5: 'I put 5 on it 🎵',
  6: 'Snipe-Demon 😈',
  7: 'Real OG Sniper 😎',
  8: 'Hall of Fame 🔥',
  9: 'Legend',
  10: 'GOAT 🐐'
};

module.exports = (bot) => {
  bot.command('leaderboard', (ctx) => {
    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    const sorted = Object.entries(stats).sort(([, a], [, b]) => b.checkouts - a.checkouts).slice(0, 10);

    if (sorted.length === 0) {
      return ctx.reply('🏁 No checkouts recorded yet!');
    }

    let reply = '🏆 *SoleSniper Leaderboard*\n\n';
    sorted.forEach(([userId, data], index) => {
      const name = data.username || `User ${userId}`;
      const title = titles[index + 1] || '';
      reply += `#${index + 1} - ${name}: ${data.checkouts} checkouts${title ? ` - _${title}_` : ''}\n`;
    });

    ctx.reply(reply, { parse_mode: 'Markdown' });
  });
};
