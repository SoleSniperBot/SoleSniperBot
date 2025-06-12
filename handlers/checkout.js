// handlers/checkout.js
const fs = require('fs');
const path = require('path');

const statsPath = path.join(__dirname, '../data/stats.json');

if (!fs.existsSync(statsPath)) {
  fs.writeFileSync(statsPath, JSON.stringify({}));
}

let stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));

function saveStats() {
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

module.exports = (bot) => {
  bot.command('checkout', (ctx) => {
    const userId = ctx.from.id;

    if (!stats[userId]) {
      stats[userId] = { checkouts: 0, spent: 0 };
    }

    stats[userId].checkouts += 1;
    stats[userId].spent += 200; // estimate £200 per pair
    saveStats();

    ctx.reply(`✅ Checkout #${stats[userId].checkouts} recorded!\n💰 Total Spent: £${stats[userId].spent}`);
  });
};
