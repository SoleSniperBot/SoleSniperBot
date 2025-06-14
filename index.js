const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// === Telegram Bot Setup ===
const bot = new Telegraf(process.env.BOT_TOKEN);

// === Load Handlers ===
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

// === Telegram Inline Button Action ===
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

// === Express App for Stripe Webhook ===
const app = express();
app.use(bodyParser.raw({ type: 'application/json' }));
app.post('/webhook', webhookHandler, initWebhook(bot));

// === Launch Bot and Server ===
const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  const domain = process.env.DOMAIN; // e.g., solesniperbot-production.up.railway.app
  const webhookURL = `https://${domain}/webhook`;

  try {
    await bot.telegram.setWebhook(webhookURL);
    console.log(`🤖 Webhook set to: ${webhookURL}`);
  } catch (err) {
    console.error('❌ Failed to set webhook:', err.message);
  }
});
