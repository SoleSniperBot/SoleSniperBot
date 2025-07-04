const fs = require('fs');
const path = require('path');
const cookPath = path.join(__dirname, '../data/cookstats.json');

// Load or initialize cook data
let cookStats = {};
if (fs.existsSync(cookPath)) {
  try {
    cookStats = JSON.parse(fs.readFileSync(cookPath, 'utf8'));
  } catch (err) {
    console.error('❌ Failed to load cookstats.json:', err.message);
  }
}

// Log a successful checkout
function updateCookTracker(userId, sku) {
  if (!cookStats[userId]) {
    cookStats[userId] = [];
  }
  cookStats[userId].push({
    sku,
    timestamp: new Date().toISOString()
  });

  fs.writeFileSync(cookPath, JSON.stringify(cookStats, null, 2));
}

module.exports = updateCookTracker;

// Command to view cook summary
module.exports.setup = (bot) => {
  bot.command('cooktracker', async (ctx) => {
    const userId = String(ctx.from.id);
    const cooked = cookStats[userId] || [];

    if (cooked.length === 0) {
      return ctx.reply('🧑‍🍳 No successful checkouts yet.\nOnce you cook, they’ll show here!');
    }

    const skuSummary = cooked.map((entry, index) =>
      `#${index + 1} – ${entry.sku} @ ${new Date(entry.timestamp).toLocaleString()}`
    ).join('\n');

    await ctx.reply(`🔥 You’ve successfully checked out *${cooked.length}* item(s):\n\n${skuSummary}`, {
      parse_mode: 'Markdown'
    });
  });
};
