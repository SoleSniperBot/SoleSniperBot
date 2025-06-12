const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

// Load bot token from environment variable
const bot = new Telegraf(process.env.BOT_TOKEN);

// Import all handlers
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

// Apply handlers
authHandler(bot);
checkoutHandler(bot);
cooktrackerHandler(bot);
faqHandler(bot);
imapHandler(bot);
leaderboardHandler(bot);
monitorHandler(bot);
profilesHandler(bot);
bulkUploadHandler(bot);
cardsHandler(bot);
jigaddressHandler(bot);
loginHandler(bot);

// Start polling
bot.launch();
console.log('🤖 Bot is now running via polling!');

// Optional Express app just to keep Render happy
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('SoleSniperBot is alive 🚀'));
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));
