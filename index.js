// index.js
const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Initialize all feature handlers
const authHandler = require('./handlers/auth');
const checkoutHandler = require('./handlers/checkout');
const cooktrackerHandler = require('./handlers/cooktracker');
const faqHandler = require('./handlers/faq');
const imapHandler = require('./handlers/imap');
const leaderboardHandler = require('./handlers/leaderboard');
const monitorHandler = require('./handlers/monitor');
const profilesHandler = require('./handlers/profiles');
const bulkUploadHandler = require('./handlers/bulkupload');
const cardsHandler = require('./handlers/cards');
const jigaddressHandler = require('./handlers/jigaddress');
const loginHandler = require('./handlers/login');
const { webhookHandler, initWebhook } = require('./handlers/webhook');

// ✅ Attach command handlers
checkoutHandler(bot);
cooktrackerHandler(bot);
faqHandler(bot);
imapHandler(bot);
leaderboardHandler(bot);
monitorHandler(bot);
profilesHandler(bot);
bulkUploadHandler(bot);
cardsHandler(bot);
jigaddressHandler(bot);
loginHandler(bot);
authHandler(bot); // ✅ includes /start, /mytier and all button callbacks

// 🧠 Inline calendar button already wired inside /start as `view_calendar`
// If needed, here is a fallback safe check:
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

// 🚀 Express server & webhook setup
const app = express();
app.use(bodyParser.raw({ type: 'application/json' }));
app.post('/webhook', webhookHandler, initWebhook(bot));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  bot.launch().then(() => console.log('🤖 Telegram bot launched'));
});
