const { Telegraf } = require('telegraf');
const express = require('express');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');

const handleCheckout = require('./handlers/checkout');
const handleFaq = require('./handlers/faq');
const handleLeaderboard = require('./handlers/leaderboard');
const handleProfiles = require('./handlers/profiles');
const handleMonitor = require('./handlers/monitor');
const handleAuth = require('./handlers/auth');
const handleImap = require('./handlers/imap');
const handleCooktracker = require('./handlers/cooktracker');
const handleCards = require('./handlers/cards');
const handleLogin = require('./handlers/login');
const handleBulkupload = require('./handlers/bulkupload');
const handleJigaddress = require('./handlers/jigaddress');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

// Register commands
bot.command('checkout', handleCheckout);
bot.command('faq', handleFaq);
bot.command('leaderboard', handleLeaderboard);
bot.command('profiles', handleProfiles);
bot.command('monitor', handleMonitor);
bot.command('auth', handleAuth);
bot.command('imap', handleImap);
bot.command('cooktracker', handleCooktracker);
bot.command('cards', handleCards);
bot.command('login', handleLogin);
bot.command('bulkupload', handleBulkupload);
bot.command('jigaddress', handleJigaddress);

// Express server for Stripe webhook
app.use(bodyParser.json({ type: 'application/json' }));
app.post('/webhook', require('./handlers/webhook'));

// Launch bot and server
bot.launch();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
