const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Handlers
const authHandler = require('./handlers/auth');
const checkoutHandler = require('./handlers/checkout');
const cooktrackerHandler = require('./handlers/cooktracker');
const faqHandler = require('./handlers/faq');
const imapHandler = require('./handlers/imap');
const leaderboardHandler = require('./handlers/leaderboard');
const monitorHandler = require('./handlers/monitor');
const profilesHandler = require('./handlers/profiles');
const bulkUploadHandler = require('./handlers/bulkupload');
const cardsHandler = require('./handlers/cards');
const jigaddressHandler = require('./handlers/jigaddress');
const loginHandler = require('./handlers/login');
const { initWebhook } = require('./handlers/webhook'); // ✅ Corrected line

// Bot Commands
bot.command('start', authHandler);
bot.command('checkout', checkoutHandler);
bot.command('cooktracker', cooktrackerHandler);
bot.command('faq', faqHandler);
bot.command('imap', imapHandler);
bot.command('leaderboard', leaderboardHandler);
bot.command('monitor', monitorHandler);
bot.command('profiles', profilesHandler);
bot.command('bulkupload', bulkUploadHandler);
bot.command('cards', cardsHandler);
bot.command('jigaddress', jigaddressHandler);
bot.command('login', loginHandler);

// Express App Setup
const app = express();
app.use(bodyParser.raw({ type: 'application/json' }));
app.post('/webhook', initWebhook(bot)); // ✅ Now working correctly

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  bot.launch();
});
