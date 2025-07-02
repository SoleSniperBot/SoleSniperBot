require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Telegraf, session } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

// Debug logging
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

// Load menu and rotateinline handlers
require('./handlers/menu')(bot);
require('./handlers/rotateinline')(bot);

// Load webhook handler
const { webhookHandler, initWebhook } = require('./handlers/webhook');

// Setup Express
const app = express();
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// Set webhook route
const domain = process.env.DOMAIN;
const webhookPath = `/webhook/${bot.secretPathComponent()}`;
bot.telegram.setWebhook(`${domain}${webhookPath}`);

// Webhook endpoint
app.use(webhookPath, webhookHandler, initWebhook(bot));

// Start Express server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server listening on port ${PORT}`);
});
