const fs = require('fs');
const path = require('path');
const express = require('express');
const { Telegraf } = require('telegraf');
const webhookHandler = require('./handlers/webhook');

const bot = new Telegraf(process.env.BOT_TOKEN);

const handlers = [
  'auth',
  'faq',
  'profiles',
  'cards',
  'login',
  'jigaddress',
  'bulkupload',
  'monitor',
  'cooktracker',
  'leaderboard',
  'checkout',
  'imap'
];

handlers.forEach(handler => {
  const handlerModule = require(`./handlers/${handler}`);
  bot.command(handler, ctx => handlerModule(ctx, bot));
});

const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => webhookHandler(req, res, bot));

bot.launch();
console.log('✅ SoleSniperBot started successfully');

module.exports = app;
