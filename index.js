require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Telegraf, session } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Enable session middleware
bot.use(session());

// Log incoming updates for debugging
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// Handlers folder path relative to root index.js
const handlersPath = path.join(__dirname, 'handlers');

// Load all handlers except webhook.js, menu.js, rotateinline.js
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

// Explicitly load menu and rotateinline handlers
require(path.join(__dirname, 'handlers', 'menu'))(bot);
require(path.join(__dirname, 'handlers', 'rotateinline'))(bot);

// Load webhook handler exports for Express integration
const { webhookHandler, initWebhook } = require(path.join(__dirname, 'handlers', 'webhook'));

bot.launch().then(() => {
  console.log('✅ SoleSniperBot is running...');
});

// Graceful shutdown handlers
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = {
  bot,
  webhookHandler,
  initWebhook,
};
