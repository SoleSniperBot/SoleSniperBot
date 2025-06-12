const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

// Load bot token from environment
const bot = new Telegraf(process.env.BOT_TOKEN);

// Load all handlers with (bot) injection
require('./handlers/auth')(bot);
require('./handlers/checkout')(bot);
require('./handlers/cooktracker')(bot);
require('./handlers/faq')(bot);
require('./handlers/imap')(bot);
require('./handlers/leaderboard')(bot);
require('./handlers/monitor')(bot);
require('./handlers/profiles')(bot);
require('./handlers/bulkupload')(bot);
require('./handlers/cards')(bot);
require('./handlers/jigaddress')(bot);
require('./handlers/login')(bot);

// Optional: inline calendar view for buttons
bot.action('view_calendar', (ctx) => {
  ctx.answerCbQuery();
  const calendarPath = path.join(__dirname, 'data/calendar.json');
  if (fs.existsSync(calendarPath)) {
    const calendar = JSON.parse(fs.readFileSync(calendarPath));
    if (calendar.length === 0) {
      return ctx.reply('📅 No upcoming drops in the calendar.');
    }

    const formatted = calendar
      .map(item => `• ${item.date}: *${item.shoe}* (SKU: \`${item.sku}\`)`)
      .join('\n');

    ctx.reply(`📅 Upcoming Drops:\n\n${formatted}`, { parse_mode: 'Markdown' });
  } else {
    ctx.reply('📅 Calendar file not found.');
  }
});

// Launch bot (polling mode)
bot.launch().then(() => {
  console.log('🤖 SoleSniperBot launched and polling for updates...');
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
