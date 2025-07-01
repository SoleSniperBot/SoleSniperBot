require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const fetchGeoProxies = require('./lib/fetchGeoProxies');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Log incoming updates
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// Load all handlers except webhook.js and menu.js
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (file.endsWith('.js') && file !== 'webhook.js' && file !== 'menu.js') {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') {
      handler(bot);
    }
  }
});

// Load menu last (to register /start, inline buttons)
require('./handlers/menu')(bot);

// Manually load webhook exports
const { webhookHandler, initWebhook } = require('./handlers/webhook');

// No free proxy fetch command here, only GeoNode fetch is in menu buttons

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
