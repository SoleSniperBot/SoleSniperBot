const fs = require('fs');
const path = require('path');
const vipPath = path.join(__dirname, '../data/vip.json');

if (!fs.existsSync(vipPath)) {
  fs.writeFileSync(vipPath, JSON.stringify({ vip: [], elite: [] }, null, 2));
}

module.exports = (bot) => {
  // START COMMAND
  bot.command('start', (ctx) => {
    const userId = String(ctx.from.id);
    const vipData = JSON.parse(fs.readFileSync(vipPath));

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

  // BUTTON: /mytier
  bot.action('mytier', (ctx) => {
    ctx.answerCbQuery();
    const userId = String(ctx.from.id);
    const vipData = JSON.parse(fs.readFileSync(vipPath));
    let tier = 'Free User 🆓';
    if (vipData.elite.includes(userId)) {
      tier = 'Elite Sniper 👑';
    } else if (vipData.vip.includes(userId)) {
      tier = 'VIP Member 💎';
    }

    ctx.reply(`🔍 Your current tier: *${tier}*`, { parse_mode: 'Markdown' });
  });

  // BUTTON: Calendar
  bot.action('view_calendar', async (ctx) => {
    ctx.answerCbQuery();
    const calendarPath = path.join(__dirname, '../data/calendar.json');
    if (!fs.existsSync(calendarPath)) {
      return ctx.reply('📅 Calendar not found.');
    }

    const calendar = JSON.parse(fs.readFileSync(calendarPath));
    if (!calendar.length) {
      return ctx.reply('📅 No upcoming drops currently.');
    }

    const text = calendar.map(item =>
      `• ${item.date || 'Date Unknown'}: *${item.shoe || 'Unnamed'}* (SKU: \`${item.sku || 'N/A'}\`)`
    ).join('\n');

    ctx.reply(`📅 Upcoming Drops:\n\n${text}`, { parse_mode: 'Markdown' });
  });

  // BUTTON: Cards
  bot.action('cards', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('💳 Please use /cards to add your card securely.');
  });

  // BUTTON: Bulk Upload
  bot.action('bulkupload', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📁 Please send your .txt or .csv file for bulk upload.\n\nFormat: `email:pass:proxy:port`', { parse_mode: 'Markdown' });
  });

  // BUTTON: Monitor
  bot.action('monitor', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📦 Monitoring enabled. Use /monitor <SKU> to begin tracking drops.');
  });
};
