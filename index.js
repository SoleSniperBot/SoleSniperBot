require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Telegraf, session } = require('telegraf');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Session middleware
bot.use(session());

// Log incoming updates
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// Load all handlers except special cases
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach(file => {
  if (
    file.endsWith('.js') &&
    !['webhook.js', 'menu.js', 'rotateinline.js'].includes(file)
  ) {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') handler(bot);
  }
});

// Load essential handlers manually
require('./handlers/menu')(bot);
require('./handlers/rotateinline')(bot);

// Webhook integration
const { webhookHandler, initWebhook } = require('./handlers/webhook');
app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf } }));
app.post('/webhook', webhookHandler, initWebhook(bot));

// Start bot
bot.launch().then(() => {
  console.log('✅ SoleSniperBot is running...');
});

// Optional: Launch Express for webhook or health check
const PORT = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('SoleSniperBot is live ✅'));
app.listen(PORT, () => {
  console.log(`🌐 Express server listening on port ${PORT}`);
});

module.exports = { bot, webhookHandler, initWebhook };
