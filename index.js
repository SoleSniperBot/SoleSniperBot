const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();
const bot = new Telegraf(process.env.BOT_TOKEN);

// === Handlers ===
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

// === Telegram Commands ===
bot.command('start', (ctx) => authHandler(bot)(ctx));
bot.command('checkout', checkoutHandler);
bot.command('cooktracker', cooktrackerHandler);
bot.command('faq', faqHandler);
bot.command('imap', imapHandler);
bot.command('leaderboard', leaderboardHandler);
bot.command('monitor', monitorHandler);
bot.command('profiles', profilesHandler);
bot.command('bulkupload', bulkUploadHandler);
bot.command('cards', cardsHandler);
bot.command('jigaddress', jigaddressHandler);
bot.command('login', loginHandler);

// === Telegram Inline Button Actions ===
bot.action('view_calendar', async (ctx) => {
  try {
    if (!ctx.from || !ctx.callbackQuery) return;
    ctx.answerCbQuery();
    const calendarPath = path.join(__dirname, 'data/calendar.json');
    if (fs.existsSync(calendarPath)) {
      const calendar = JSON.parse(fs.readFileSync(calendarPath));
      if (calendar.length === 0) {
        return ctx.reply('📅 No upcoming drops in the calendar.');
      }

      const formatted = calendar
        .map(item => `• ${item.date || 'undefined'}: *${item.shoe || 'undefined'}* (SKU: \`${item.sku || 'N/A'}\`)`)
        .join('\n');

      ctx.reply(`📅 Upcoming Drops:\n\n${formatted}`, { parse_mode: 'Markdown' });
    } else {
      ctx.reply('📅 Calendar file not found.');
    }
  } catch (err) {
    console.error(err);
    ctx.reply('❌ Error loading calendar.');
  }
});

// === Express + Stripe Webhook Setup ===
const app = express();
app.use(bodyParser.raw({ type: 'application/json' }));
app.post('/webhook', webhookHandler, initWebhook(bot));

// === Start Bot & Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  bot.launch().then(() => console.log('🤖 Telegram bot launched via polling'));
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
