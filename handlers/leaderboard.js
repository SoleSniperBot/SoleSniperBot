const fs = require('fs');
const path = require('path');

// Path to the stats JSON file
const statsPath = path.join(__dirname, '../data/stats.json');

// Function to safely load stats data
function getStats() {
  try {
    const data = fs.readFileSync(statsPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

// Main leaderboard handler
module.exports = async function handleLeaderboard(ctx) {
  const stats = getStats();

  const sorted = Object.entries(stats)
    .sort((a, b) => b[1].checkouts - a[1].checkouts)
    .slice(0, 10);

  let message = '*🏆 SoleSniper Leaderboard:*\n\n';

  sorted.forEach(([userId, data], index) => {
    message += `${index + 1}. [User ${userId}]: ${data.checkouts} checkouts\n`;
  });

  ctx.replyWithMarkdown(message);
};
