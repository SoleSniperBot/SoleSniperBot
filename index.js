require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const { webhookHandler, initWebhook } = require('./handlers/webhook');
const authHandler = require('./handlers/auth');

const bot = new Telegraf(process.env.BOT_TOKEN);

const app = express();
app.use(express.json());

// Stripe webhook middleware
app.post('/webhook', webhookHandler, initWebhook(bot));

// Telegram webhook endpoint
app.use(bot.webhookCallback('/'));

const PORT = process.env.PORT || 8080;

// Load commands/handlers
authHandler(bot);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  const domain = process.env.DOMAIN;
  if (domain) {
    try {
      await bot.telegram.setWebhook(`${domain}/`);
      console.log(`🤖 Webhook set to: ${domain}/`);
    } catch (err) {
      console.error('❌ Failed to set webhook:', err.message);
    }
  }
});
