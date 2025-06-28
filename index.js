require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Log all incoming updates
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// ✅ Load all handlers from /handlers folder except webhook.js
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (file.endsWith('.js') && file !== 'webhook.js') {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') {
      handler(bot);
    } else {
      console.warn(`⚠️ Handler "${file}" does not export a function.`);
    }
  }
});

// ✅ Load webhook.js manually
const { webhookHandler, initWebhook } = require('./handlers/webhook');

// 🚀 Launch the bot
bot.launch().then(() => {
  console.log('✅ SoleSniperBot is running...');
});

// 🛑 Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// 🔁 Export for external use (e.g., webhook setup)
module.exports = {
  bot,
  webhookHandler,
  initWebhook,
};
