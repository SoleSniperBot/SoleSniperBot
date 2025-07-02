const express = require('express');
const bodyParser = require('body-parser');
const { bot, webhookHandler, initWebhook } = require('./index');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse Stripe webhook payloads raw
app.use('/stripe', bodyParser.raw({ type: 'application/json' }));
app.post('/stripe', webhookHandler, initWebhook(bot));

// Telegram webhook route (parsed normally)
app.use(bodyParser.json());
app.post('/telegram', (req, res) => {
  bot.handleUpdate(req.body, res);
});

// Set webhook on startup
(async () => {
  const webhookUrl = `${process.env.BOT_DOMAIN}/telegram`;
  await bot.telegram.setWebhook(webhookUrl);
  console.log(`🚀 Webhook set: ${webhookUrl}`);
})();

// Start Express server
app.listen(PORT, () => {
  console.log(`🌐 Express server listening on port ${PORT}`);
});
