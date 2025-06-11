const { Markup } = require('telegraf');
const { handleStats } = require('./handlers/CookTracker');
const handleSaveJig = require('./Handlers/saveJiggedAddress');
const handleJigAddressCommand = require('./handlers/jigaddress');
bot.command('jigaddress', handleJigAddressCommand);
const monitor = require("./Handlers/monitor");
const handleIMAP = require('./Handlers/imap');
const handleBulkUpload = require('./Handlers/bulkUpload');
const { Telegraf } = require('telegraf');
const express = require('express');
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

bot.launch();
app.listen(PORT, () => {
    console.log(`Server live on http://localhost:${PORT}`);
});
