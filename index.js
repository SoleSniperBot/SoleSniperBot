require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf, session } = require('telegraf');

const app = express();
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

// Load menu & rotateinline handlers
require('./handlers/menu')(bot);
require('./handlers/rotateinline')(bot);

// Load webhook handler
const { webhookHandler, initWebhook } = require('./handlers/webhook');

// 🔗 Stripe webhook must use raw body parser
app.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  webhookHandler,
  initWebhook(bot)
);

// ✅ Start both bot and server
bot.launch().then(() => {
  console.log('✅ SoleSniperBot is running...');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🌐 Express server listening on port ${PORT}`);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
