const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const app = express();
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // make sure this is before you use any env vars

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Stripe needs raw body BEFORE any body parsing middleware
app.use('/webhook', express.raw({ type: 'application/json' }));

// All other routes use standard JSON parser
app.use(express.json());

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
app.get("/", (req, res) => {
  res.send("SoleSniperBot is live 🚀");
});
app.post("/webhook", (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const customerId = event.data.object.client_reference_id;

    // Optional: Add to Vip.json or perform post-checkout logic
    console.log("✅ VIP Checkout detected for:", customerId);
  }

  res.status(200).json({ received: true });
});
const handleCard = require('./Handlers/card');
const { Markup } = require('telegraf');
const { handleStats } = require('./handlers/CookTracker');
const handleSaveJig = require('./Handlers/saveJiggedAddress');
const handleJigAddressCommand = require('./handlers/jigaddress');
bot.command('jigaddress', handleJigAddressCommand);
const monitor = require("./Handlers/monitor");
const handleIMAP = require('./Handlers/imap');
const handleBulkUpload = require('./Handlers/bulkUpload');
const { Telegraf } = require('telegraf');

// ✅ Stripe middleware first
app.use('/webhook', express.raw({ type: 'application/json' }));

// ✅ JSON parser for normal routes
app.use(express.json());
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// In-memory VIP user tracking
let vipUsers = new Set();

// Stripe webhook handling
app.post('/webhook', (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const customerId = event.data.object.client_reference_id;
        vipUsers.add(parseInt(customerId));
    }

    res.status(200).send('Received');
});

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
require('./handlers/login')(bot);
require('./handlers/cards')(bot);
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
// /upgrade command
bot.command('upgrade', (ctx) => {
    ctx.reply('To upgrade, pay here:\nhttps://buy.stripe.com/3cIfZg6WI4NBbG7dovcfK01');
});

// Express endpoint to verify bot is alive
app.get('/', (req, res) => {
    res.send('SoleSniperBot is running.');
});

handleLogin(bot);
handleCards(bot);
bot.launch();
app.listen(PORT, () => {
    console.log(`Server live on http://localhost:${PORT}`);
});
