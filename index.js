const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

// Stripe raw body parser only for webhook route
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(bodyParser.json()); // Standard parser for other routes

// ✅ Load Stripe webhook handler
const { webhookHandler, initWebhook, vipUsers } = require('./Handlers/webhook');
app.post('/webhook', webhookHandler, initWebhook(bot));

// ✅ Telegram bot logic
bot.start((ctx) => {
  const isVip = vipUsers.has(ctx.from.id);
  const welcomeText = isVip
    ? '👑 Welcome back, Pro+ Sniper!'
    : '👋 Welcome to SoleSniperBot. To unlock all features, upgrade via /upgrade.';

  ctx.reply(welcomeText,
    Markup.inlineKeyboard([
      [Markup.button.callback('📦 My Profiles', 'view_profiles')],
      [Markup.button.callback('🎯 Start Monitoring', 'start_monitor')],
      [Markup.button.callback('💳 Add Card', 'add_card')],
      [Markup.button.callback('🆙 Upgrade to Pro+', 'upgrade')],
    ])
  );
});

// ✅ Bot commands & actions
bot.command('upgrade', (ctx) => {
  ctx.reply('To upgrade, pay here:\nhttps://buy.stripe.com/3cIfZg6WI4NBbG7dovcfK01');
});
bot.action('view_profiles', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('👟 Use /profiles to manage your delivery setups.');
});
bot.action('start_monitor', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('🚨 Use /monitor to start SKU alerts.');
});
bot.action('add_card', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('💳 Use /profiles to add your card & address.');
});
bot.action('upgrade', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('🔓 Upgrade here: https://buy.stripe.com/3cIfZg6WI4NBbG7dovcfK01');
});

// ✅ Load all feature modules (NOTE: Updated to "Handlers" capitalized)
require('./Handlers/login')(bot);
require('./Handlers/cards')(bot);
require('./Handlers/imap')(bot);
require('./Handlers/Checkout')(bot);
require('./Handlers/Faq')(bot);
require('./Handlers/Leaderboard')(bot);
require('./Handlers/Cooktracker')(bot);
require('./Handlers/Monitor')(bot);
require('./Handlers/saveJiggedAddress')(bot);
require('./Handlers/jigaddress')(bot);
require('./Handlers/bulkUpload')(bot);
require('./Handlers/Profiles')(bot);
require('./Handlers/auth')(bot);

// ✅ Health check route
app.get('/', (req, res) => {
  res.send('SoleSniperBot is live 🚀');
});

// ✅ Start everything
bot.launch();
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
