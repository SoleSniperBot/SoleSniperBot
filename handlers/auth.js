// handlers/auth.js
const fs = require('fs');
const path = require('path');
const vipPath = path.join(__dirname, '../data/vip.json');

if (!fs.existsSync(vipPath)) {
  fs.writeFileSync(vipPath, JSON.stringify({ vip: [], elite: [] }, null, 2));
}

module.exports = (bot) => {
  bot.command('start', (ctx) => {
    const userId = String(ctx.from.id);
    let vipData = JSON.parse(fs.readFileSync(vipPath));

    let tier = 'Free User 🆓';
    if (vipData.elite.includes(userId)) {
      tier = 'Elite Sniper 👑';
    } else if (vipData.vip.includes(userId)) {
      tier = 'VIP Member 💎';
    }

    ctx.reply(`👋 Welcome to SoleSniperBot!\n\nYour tier: *${tier}*\n\nUse the buttons below to get started.`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📦 Start Monitoring', callback_data: 'monitor' }],
          [{ text: '📅 Calendar', callback_data: 'view_calendar' }],
          [{ text: '💳 Add Card', callback_data: 'cards' }],
          [{ text: '📁 Upload Accounts', callback_data: 'bulkupload' }],
          [{ text: '📊 My Tier', callback_data: 'mytier' }]
        ]
      }
    });
  });

  bot.command('mytier', (ctx) => {
    const userId = String(ctx.from.id);
    let vipData = JSON.parse(fs.readFileSync(vipPath));

    let tier = 'Free User 🆓';
    if (vipData.elite.includes(userId)) {
      tier = 'Elite Sniper 👑';
    } else if (vipData.vip.includes(userId)) {
      tier = 'VIP Member 💎';
    }

    ctx.reply(`🔍 Your current tier: *${tier}*`, { parse_mode: 'Markdown' });
  });
};
