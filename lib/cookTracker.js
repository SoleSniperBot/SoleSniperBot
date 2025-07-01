const fs = require('fs');
const path = require('path');

const statsPath = path.join(__dirname, '../data/stats.json');

let stats = fs.existsSync(statsPath)
  ? JSON.parse(fs.readFileSync(statsPath, 'utf8'))
  : {};

/**
 * Update cook stats for a user
 * @param {string} userId
 * @param {number} amountSpent
 */
function recordCook(userId, amountSpent = 0) {
  if (!stats[userId]) {
    stats[userId] = { checkouts: 0, spent: 0 };
  }
  stats[userId].checkouts += 1;
  stats[userId].spent += amountSpent;

  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

module.exports = {
  recordCook,
};
