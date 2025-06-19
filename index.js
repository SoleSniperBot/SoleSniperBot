require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const { webhookHandler, initWebhook } = require('./handlers/webhook');
const fs = require('fs');
const path = require('path');

// === Init Bot ===
const bot = new Telegraf(process.env.BOT_TOKEN);

// === Load Handlers ===
require('./handlers/proxies')(bot);
require('./handlers/snkrs')(bot);
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
require('./handlers/genaccount')(bot);
require('./handlers/bulkgen')(bot);
require('./handlers/accountChecker')(bot);
require('./handlers/accountGenerator')(bot);

// === Setup Express ===
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Stripe Webhook
app.post('/webhook', webhookHandler, initWebhook(bot));

// === Telegram Webhook Setup ===
const DOMAIN = process.env.DOMAIN;
if (DOMAIN) {
  bot.telegram.setWebhook(`${DOMAIN}/telegram-webhook`);
  app.use(bot.webhookCallback('/telegram-webhook'));
}

// === Graceful Shutdown ===
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// === Webhook Setup Retry Logic ===
async function setTelegramWebhook(retries = 5, delay = 3000) {
  if (!DOMAIN) {
    console.warn('⚠️ DOMAIN not set. Skipping webhook setup.');
    return false;
  }

  const url = `${DOMAIN}/telegram-webhook`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔧 Attempt ${attempt}: Setting webhook to ${url}`);
      await bot.telegram.setWebhook(url);
      console.log(`✅ Webhook set to ${url}`);
      return true;
    } catch (err) {
      console.error(`❌ Webhook setup failed on attempt ${attempt}: ${err.message}`);
      if (attempt < retries) {
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  console.error('❌ All attempts to set webhook failed.');
  return false;
}

// === Start Server ===
const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  const webhookSet = await setTelegramWebhook();

  if (!webhookSet) {
    console.warn('⚠️ Falling back to long polling...');
    bot.launch();
    console.log('🤖 SoleSniperBot launched via polling.');
  }
});
