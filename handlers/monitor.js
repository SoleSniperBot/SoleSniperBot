const fs = require('fs');
const path = require('path');
const calendarPath = path.join(__dirname, '../data/calendar.json');

module.exports = (bot) => {
  bot.command('calendar', (ctx) => {
    if (!fs.existsSync(calendarPath)) {
      return ctx.reply('📭 No upcoming drops found.');
    }

    const calendar = JSON.parse(fs.readFileSync(calendarPath));
    if (!Array.isArray(calendar) || calendar.length === 0) {
      return ctx.reply('📭 No upcoming drops available.');
    }

    const response = calendar.map(entry => (
      `👟 *${entry.name}*\nSKU: \`${entry.sku}\`\n📅 Release: *${entry.date}*`
    )).join('\n\n');

    ctx.reply(response, { parse_mode: 'Markdown' });
  });

  bot.action('view_calendar', (ctx) => {
    if (!fs.existsSync(calendarPath)) {
      return ctx.reply('📭 No upcoming drops found.');
    }

    const calendar = JSON.parse(fs.readFileSync(calendarPath));
    if (!Array.isArray(calendar) || calendar.length === 0) {
      return ctx.reply('📭 No upcoming drops available.');
    }

    const response = calendar.map(entry => (
      `👟 *${entry.name}*\nSKU: \`${entry.sku}\`\n📅 Release: *${entry.date}*`
    )).join('\n\n');

    ctx.answerCbQuery();
    ctx.reply(response, { parse_mode: 'Markdown' });
  });
};
