const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

// Load VIP list from JSON
const vipPath = path.join(__dirname, 'Data', 'Vip.json');
let vipList = [];
if (fs.existsSync(vipPath)) {
  vipList = JSON.parse(fs.readFileSync(vipPath));
}

// ✅ Stripe webhook (must use raw body)
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const telegramId = session.client_reference_id;

    if (telegramId && !vipList.includes(telegramId)) {
      vipList.push(telegramId);
      fs.writeFileSync(vipPath, JSON.stringify(vipList, null, 2));
      console.log('✅ VIP added:', telegramId);

      bot.telegram.sendMessage(
        telegramId,
        '👑 Your SoleSniper Pro+ VIP is now active! You now have full access.'
      );
    }
  }

  res.status(200).send('✅ Webhook received');
});

// 👟 Telegram Commands
bot.start((ctx) => {
  const isVip = vipList.includes(ctx.from.id.toString());
  const welcomeMsg = isVip
    ? '👑 Welcome back, Pro+ Sniper!'
    : '👋 Welcome to SoleSniperBot. Upgrade via /upgrade to unlock all features.';

  ctx.reply(welcomeMsg, Markup.inlineKeyboard([
    [Markup.button.callback('📦 My Profiles', 'view_profiles')],
    [Markup.button.callback('🎯 Start Monitoring', 'start_monitor')],
    [Markup.button.callback('💳 Add Card', 'add_card')],
    [Markup.button.callback('🆙 Upgrade to Pro+', 'upgrade')]
  ]));
});

bot.command('upgrade', (ctx) => {
  ctx.reply('To upgrade, pay here:\nhttps://buy.stripe.com/3cIfZg6WI4NBbG7dovcfK01');
});

// Inline button actions
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

// Register Handlers
require('./handlers/login')(bot);
require('./handlers/cards')(bot);
require('./Handlers/monitor')(bot);
require('./Handlers/imap')(bot);
require('./Handlers/card')(bot);
require('./Handlers/saveJiggedAddress')(bot);
bot.command('jigaddress', require('./handlers/jigaddress'));
bot.command('profiles', require('./handlers/Profiles'));
bot.command('bulk', require('./Handlers/bulkUpload'));

// Server + bot start
app.use(bodyParser.json());
app.get('/', (req, res) => res.send('SoleSniperBot is running.'));
bot.launch();
app.listen(PORT, () => {
  console.log(`🚀 SoleSniper running on http://localhost:${PORT}`);
});
