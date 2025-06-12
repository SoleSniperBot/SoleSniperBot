const fs = require('fs');
const path = require('path');
const express = require('express');
const { Telegraf } = require('telegraf');
const bodyParser = require('body-parser');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

const vipPath = path.join(__dirname, 'data/vip.json');
let vipUsers = { vip: [], elite: [] };
if (fs.existsSync(vipPath)) {
  vipUsers = JSON.parse(fs.readFileSync(vipPath, 'utf8'));
}

// Load handlers
const handleAuth = require('./handlers/auth');
const handleBulkUpload = require('./handlers/bulkUpload');
const handleCards = require('./handlers/cards');
const handleCheckout = require('./handlers/checkout');
const handleCooktracker = require('./handlers/cooktracker');
const handleFaq = require('./handlers/faq');
const handleImap = require('./handlers/imap');
const handleLeaderboard = require('./handlers/leaderboard');
const handleLogin = require('./handlers/login');
const handleMonitor = require('./handlers/monitor');
const handleProfiles = require('./handlers/profiles');
const handleJigAddress = require('./handlers/jigaddress');

// Command routing
bot.start((ctx) => {
  const isVip = vipUsers.vip.includes(String(ctx.from.id)) || vipUsers.elite.includes(String(ctx.from.id));
  if (!isVip) {
    return ctx.reply(
      '👋 Welcome to SoleSniperBot! Access exclusive sneaker tools 👟.\n\nTo unlock VIP, purchase access here:\nhttps://buy.stripe.com/eVq00iepa4NB39BbgncfK00',
      { parse_mode: 'Markdown' }
    );
  }
  ctx.reply('🔥 VIP Access Granted! Use /faq to get started.', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📖 FAQ', callback_data: 'faq' }],
        [{ text: '👤 Add Profiles', callback_data: 'profiles' }],
        [{ text: '🎯 Start Monitor', callback_data: 'monitor' }],
      ],
    },
  });
});

// Callback button handlers
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  switch (data) {
    case 'faq':
      return handleFaq(ctx);
    case 'profiles':
      return handleProfiles(ctx);
    case 'monitor':
      return handleMonitor(ctx);
    default:
      return ctx.answerCbQuery('Unknown action.');
  }
});

// Additional command bindings
bot.command('auth', handleAuth);
bot.command('upload', handleBulkUpload);
bot.command('cards', handleCards);
bot.command('checkout', handleCheckout);
bot.command('cooktracker', handleCooktracker);
bot.command('imap', handleImap);
bot.command('leaderboard', handleLeaderboard);
bot.command('login', handleLogin);
bot.command('jigaddress', handleJigAddress);

// Launch bot
bot.launch();
console.log('SoleSniperBot is running ✅');

// Stripe webhook
app.use(bodyParser.json());
app.post('/webhook', require('./handlers/webhook')(vipUsers, vipPath, bot));

// Start Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
