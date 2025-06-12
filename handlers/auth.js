// handlers/auth.js
const fs = require('fs');
const path = require('path');

const vipPath = path.join(__dirname, '../data/vip.json');
let vipData = { vip: [], elite: [] };

// Load VIP data on startup
if (fs.existsSync(vipPath)) {
  vipData = JSON.parse(fs.readFileSync(vipPath, 'utf8'));
}

// Export VIP check middleware
function isVip(ctx, next) {
  const userId = ctx.from.id;
  const allVip = [...vipData.vip, ...vipData.elite];

  if (allVip.includes(userId)) {
    return next();
  } else {
    return ctx.reply('🔒 This feature is for Pro+ users only.\nUse /upgrade to unlock access.');
  }
}

module.exports = (bot) => {
  bot.use((ctx, next) => {
    ctx.isVip = () => {
      const userId = ctx.from?.id;
      return [...vipData.vip, ...vipData.elite].includes(userId);
    };
    return next();
  });

  // Protect specific commands by wrapping them with isVip
  bot.command('cooktracker', isVip, (ctx) => {
    ctx.reply('📈 Your cook tracker stats will appear here soon!');
  });
};
