require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const { webhookHandler, initWebhook } = require('./handlers/webhook');
const authHandler = require('./handlers/auth');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 8080;
const DOMAIN = process.env.DOMAIN;

// Middleware to parse JSON
app.use(express.json());

// Stripe webhook listener
app.post('/webhook', webhookHandler, initWebhook(bot));

// Telegram webhook handler
app.use(bot.webhookCallback('/'));

// Register all handlers
authHandler(bot);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  if (!DOMAIN) {
    console.error('❌ DOMAIN not set in environment variables');
    return;
  }

  try {
    await bot.telegram.setWebhook(`${DOMAIN}/`);
    const info = await bot.telegram.getWebhookInfo();

    if (info.url === `${DOMAIN}/`) {
      console.log(`🤖 Telegram webhook set successfully at: ${info.url}`);
    } else {
      console.warn(`⚠️ Webhook mismatch. Currently set to: ${info.url}`);
    }
  } catch (err) {
    console.error('❌ Failed to set Telegram webhook:', err.message);
  }
});
