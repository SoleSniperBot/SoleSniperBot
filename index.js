require('dotenv').config();
const fs = require('fs');
const path = require('path');
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
const { webhookHandler, initWebhook } = require('./handlers/webhook');

module.exports = { bot, webhookHandler, initWebhook };
