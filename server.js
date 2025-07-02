require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { bot, webhookHandler, initWebhook } = require('./index'); // make sure index.js exports correctly

const app = express();
const PORT = process.env.PORT || 8080;

// Stripe needs raw body for webhook signature verification
app.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  webhookHandler,
  initWebhook(bot)
);

// Telegram webhook handler (if you're not using polling)
app.use(bot.webhookCallback('/telegram'));

app.get('/', (req, res) => {
  res.send('👟 SoleSniperBot is alive.');
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  bot.telegram.setWebhook(`${process.env.BOT_DOMAIN}/telegram`);
});
