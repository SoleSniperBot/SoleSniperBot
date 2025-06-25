require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);

// 🧠 Debug: Log all incoming updates
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// ✅ Load all handlers that export functions
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (file.endsWith('.js') && file !== 'webhook.js') {  // Skip webhook.js here
    const handler = require(path.join(handlersPath, file));
    console.log(`Loading handler: ${file} - type: ${typeof handler}`);
    if (typeof handler === 'function') {
      handler(bot);
    } else {
      console.warn(`⚠️ Handler "${file}" does not export a function and was skipped.`);
    }
  }
});

// ✅ Manually load webhook.js exports separately
const { webhookHandler, initWebhook } = require('./handlers/webhook');

// Example: If you are using Express.js server, you can use:
// const express = require('express');
// const app = express();
// app.post('/stripe-webhook', express.raw({type: 'application/json'}), webhookHandler, initWebhook(bot));

// If you want to add /testimap command inline:
const testImapHandler = require('./handlers/testImap');
bot.command('testimap', async (ctx) => {
  await testImapHandler(ctx);
});

// 🚀 Start the bot
bot.launch().then(() => {
  console.log('✅ SoleSniperBot is running...');
});

// 🛑 Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = {
  bot,
  webhookHandler,
  initWebhook,
};
