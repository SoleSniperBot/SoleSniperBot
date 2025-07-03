// lib/cookTracker.js
const fs = require('fs');
const path = require('path');
const statsPath = path.join(__dirname, '../data/stats.json');

const statusTitles = {
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

function updateCookTracker(userId, sku) {
  const id = String(userId);
  const stats = fs.existsSync(statsPath)
    ? JSON.parse(fs.readFileSync(statsPath, 'utf8'))
    : {};

  if (!stats[id]) {
    stats[id] = {
      successCount: 0,
      estimatedSpent: 0,
      title: 'Sniper',
      lastDrop: '',
      lastDate: ''
    };
  }

  stats[id].successCount += 1;
  stats[id].estimatedSpent = stats[id].successCount * 200;
  stats[id].lastDrop = sku;
  stats[id].lastDate = new Date().toLocaleDateString('en-GB');

  const level = stats[id].successCount;
  stats[id].title = statusTitles[level] || 'Hall of Fame 🔥';

  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

module.exports = updateCookTracker;
