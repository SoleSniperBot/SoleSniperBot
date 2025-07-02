require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Telegraf, session } = require('telegraf');
const { webhookHandler, initWebhook } = require('./handlers/webhook');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

// Debug log
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// Load all handlers except webhook.js, menu.js, rotateinline.js
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
require('./handlers/menu')(bot);
require('./handlers/rotateinline')(bot);

// Set up Express and webhook
const app = express();
app.use(express.json());
app.use(webhookHandler);

const PORT = process.env.PORT || 8080;

// Webhook endpoint
app.post('/webhook', initWebhook(bot));

// Launch webhook on bot
bot.telegram.setWebhook(`${process.env.DOMAIN}/webhook`); // DOMAIN = your Railway URL

// Start Express server
app.listen(PORT, () => {
  console.log(`🌍 Express server listening on port ${PORT}`);
});
