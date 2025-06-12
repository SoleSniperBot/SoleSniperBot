require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const { webhookHandler, initWebhook, vipUsers } = require('./handlers/webhook');
const login = require('./handlers/login');
const profiles = require('./handlers/profiles');
const leaderboard = require('./handlers/leaderboard');
const faq = require('./handlers/faq');
const checkout = require('./handlers/checkout');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use((ctx, next) => {
  if (ctx.updateType === 'message' || ctx.updateType === 'callback_query') {
    const userId = ctx.from.id;
    if (!vipUsers.has(userId) && ctx.updateType === 'message' && ctx.message.text !== '/start') {
      return ctx.reply('🔒 This command is for VIP members only. Visit https://buy.stripe.com/eVq00iepa4NB39Bbgn to join.');
    }
  }
  return next();
});

bot.start((ctx) => {
  ctx.reply('👋 Welcome to SoleSniperBot! Use /faq or /profiles to begin.');
});

login(bot);
profiles(bot);
leaderboard(bot);
faq(bot);
checkout(bot);

const app = express();
app.use(bodyParser.json());
app.use(webhookHandler);
app.post('/webhook', initWebhook(bot));
app.get('/', (req, res) => res.send('SoleSniperBot is live 🚀'));
bot.launch();
console.log('✅ SoleSniperBot started');

process.on('SIGINT', () => bot.stop('SIGINT'));
process.on('SIGTERM', () => bot.stop('SIGTERM'));
