require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Load handlers
const faqHandler = require('./handlers/faq');
const leaderboardHandler = require('./handlers/leaderboard');
const profilesHandler = require('./handlers/profiles');
const checkoutHandler = require('./handlers/checkout');
const cardsHandler = require('./handlers/cards');
const authHandler = require('./handlers/auth');
const imapHandler = require('./handlers/imap');
const monitorHandler = require('./handlers/monitor');
const bulkUploadHandler = require('./handlers/bulkupload');
const jigAddressHandler = require('./handlers/jigaddress');
const loginHandler = require('./handlers/login');
const cookTrackerHandler = require('./handlers/cooktracker');

// Stripe webhook support
const { webhookHandler, initWebhook } = require('./handlers/webhook');

// Bot commands
bot.command('faq', faqHandler);
bot.command('leaderboard', leaderboardHandler);
bot.command('profiles', profilesHandler);
bot.command('checkout', checkoutHandler);
bot.command('cards', cardsHandler);
bot.command('auth', authHandler);
bot.command('imap', imapHandler);
bot.command('monitor', monitorHandler);
bot.command('bulkupload', bulkUploadHandler);
bot.command('jigaddress', jigAddressHandler);
bot.command('login', loginHandler);
bot.command('cooktracker', cookTrackerHandler);

// Express server for webhook
const app = express();
app.use(bodyParser.raw({ type: 'application/json' }));

// Stripe webhook endpoint
app.post('/webhook', webhookHandler, initWebhook(bot));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  bot.launch();
});
