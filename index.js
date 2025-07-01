require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Log all incoming updates for debugging
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// Load all handlers except webhook.js and menu.js
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (
    file.endsWith('.js') &&
    file !== 'webhook.js' &&
    file !== 'menu.js'
  ) {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') {
      handler(bot);
    }
  }
});

// Explicitly load menu.js
const menuHandler = require('./handlers/menu');
menuHandler(bot);

// Explicitly load new nikeCheckout handler
const nikeCheckoutHandler = require('./handlers/nikeCheckout');
nikeCheckoutHandler(bot);

// Load webhook handlers if applicable
const { webhookHandler, initWebhook } = require('./handlers/webhook');

// Start bot
bot.launch().then(() => {
  console.log('✅ SoleSniperBot is running...');
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = {
  bot,
  webhookHandler,
  initWebhook,
};
