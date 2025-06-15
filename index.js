const express = require('express');
const { Telegraf } = require('telegraf');
const bodyParser = require('body-parser');
const { webhookHandler, initWebhook } = require('./handlers/webhook');
const setupAuth = require('./handlers/auth');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// Stripe Webhook
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), webhookHandler, initWebhook(bot));

// Telegram Webhook
const domain = process.env.DOMAIN;
if (!domain) {
  throw new Error('❌ DOMAIN environment variable not set');
}

bot.telegram.setWebhook(`${domain}/bot${process.env.BOT_TOKEN}`);
app.use(bot.webhookCallback(`/bot${process.env.BOT_TOKEN}`));

// Bot Features
setupAuth(bot);

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 Webhook set to: ${domain}/bot${process.env.BOT_TOKEN}`);
});
