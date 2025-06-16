require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const { webhookHandler, initWebhook } = require('./handlers/webhook');
const fs = require('fs');
const path = require('path');

// === Init Bot ===
const bot = new Telegraf(process.env.BOT_TOKEN);

// === Load Handlers ===
require('./handlers/stockMonitor')(bot);
require('./handlers/auth')(bot);
require('./handlers/profiles')(bot);
require('./handlers/faq')(bot);
require('./handlers/imap')(bot);
require('./handlers/monitor')(bot);
require('./handlers/checkout')(bot);
require('./handlers/cooktracker')(bot);
require('./handlers/leaderboard')(bot);
require('./handlers/bulkupload')(bot);
require('./handlers/cards')(bot);
require('./handlers/jigaddress')(bot);
require('./handlers/login')(bot);

// === Setup Express ===
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Stripe Webhook Middleware
app.post('/webhook', webhookHandler, initWebhook(bot));

// Telegram Webhook
app.use(bot.webhookCallback('/'));

// === Start Server ===
const PORT = process.env.PORT || 8080;
const DOMAIN = process.env.DOMAIN; // e.g., https://solesniperbot-production.up.railway.app

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  if (DOMAIN) {
    try {
      await bot.telegram.setWebhook(`${DOMAIN}/`);
      console.log(`🤖 Telegram Webhook set to: ${DOMAIN}/`);
    } catch (err) {
      console.error('❌ Failed to set Telegram webhook:', err.message);
    }
  } else {
    console.warn('⚠️ DOMAIN environment variable is not set. Telegram webhook not registered.');
  }
});

// === Graceful Shutdown ===
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
