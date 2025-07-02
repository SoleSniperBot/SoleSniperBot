require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Telegraf, session } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

// Debug log
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// Load handlers except webhook.js, menu.js, rotateinline.js
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach(file => {
  if (
    file.endsWith('.js') &&
    file !== 'webhook.js' &&
    file !== 'menu.js' &&
    file !== 'rotateinline.js'
  ) {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') {
      handler(bot);
    }
  }
});

// Load menu & rotateinline
require('./handlers/menu')(bot);
require('./handlers/rotateinline')(bot);

// Webhook exports
const {
  webhookHandler,
  initWebhook,
  setTelegramWebhook
} = require('./handlers/webhook');

// Express server for Stripe webhook
const app = express();
app.use(express.json());
app.post('/webhook', webhookHandler, initWebhook(bot));

const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  console.log(`🌐 Express server listening on port ${PORT}`);
  await setTelegramWebhook(bot); // ✅ Set Telegram webhook on launch
});

module.exports = { bot, webhookHandler, initWebhook };
