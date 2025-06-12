// handlers/monitor.js
const { Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

const calendarPath = path.join(__dirname, '../data/calendar.json');

if (!fs.existsSync(calendarPath)) {
  fs.writeFileSync(calendarPath, JSON.stringify([]));
}

module.exports = (bot) => {
  bot.command('monitor', (ctx) => {
    ctx.reply(
      '👟 Enter the SKU(s) you want to monitor (separate multiple SKUs by commas):',
      Markup.inlineKeyboard([
        [Markup.button.callback('📅 View Calendar', 'view_calendar')]
      ])
    );
  });

  bot.action('view_calendar', (ctx) => {
    ctx.answerCbQuery();
    const calendar = JSON.parse(fs.readFileSync(calendarPath));

    if (calendar.length === 0) {
      return ctx.reply('📅 No upcoming drops in the calendar.');
    }

    const formatted = calendar.map(item => `• ${item.date}: *${item.shoe}* (SKU: \`${item.sku}\`)`).join('\n');
    ctx.reply(`📅 Upcoming Drops:\n\n${formatted}`, { parse_mode: 'Markdown' });
  });

  bot.on('text', (ctx) => {
    const input = ctx.message.text.trim();
    const skus = input.split(',').map(sku => sku.trim().toUpperCase()).filter(Boolean);

    if (skus.length === 0) {
      return ctx.reply('⚠️ Please enter at least one valid SKU.');
    }

    ctx.reply(`✅ Monitoring SKUs:\n${skus.map(s => `• ${s}`).join('\n')}\n\nEarly ping monitor active. You will be alerted when a product loads.`, {
      parse_mode: 'Markdown'
    });

    // Here you would plug in SKU monitor logic or webhook integration
    // Example: startMonitoringSKUs(ctx.from.id, skus);
  });
};
