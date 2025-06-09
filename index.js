const { Telegraf } = require('telegraf');
const express = require('express');
const bodyParser = require('body-parser');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

let vipUsers = new Set(); // In-memory VIP user store

// ============ VIP System ============

const STRIPE_SECRET = process.env.STRIPE_SECRET;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = require('stripe')(STRIPE_SECRET);

bot.start((ctx) => {
  const isVip = vipUsers.has(ctx.from.id);
  const msg = isVip
    ? '👋 Welcome back, Pro+ member. You’re fully unlocked!'
    : '👋 Welcome to SoleSniperBot!\n\nUse /upgrade to unlock Pro+ access and cook 🔥';
  ctx.reply(msg);
});

bot.command('upgrade', (ctx) => {
  ctx.reply('💳 Upgrade to Pro+ here:\nhttps://buy.stripe.com/3cIfZg6WI4NBbG7dovcfK01');
});

bot.command('upgradepro', (ctx) => {
  const senderId = ctx.from.id;
  if (senderId === parseInt(process.env.ADMIN_ID)) {
    const args = ctx.message.text.split(' ');
    const userId = parseInt(args[1]);
    if (!isNaN(userId)) {
      vipUsers.add(userId);
      ctx.reply(`✅ User ${userId} upgraded to Pro+`);
    } else {
      ctx.reply('⚠️ Invalid ID.');
    }
  } else {
    ctx.reply('❌ Unauthorized');
  }
});

// ============ Restricted Command Example ============
bot.command('dropcalendar', (ctx) => {
  if (!vipUsers.has(ctx.from.id)) {
    return ctx.reply('🔒 This is a Pro+ feature. Use /upgrade to unlock.');
  }
  ctx.reply('📅 Cook Calendar:\n- June 10: Air Max 95 Neon\n- June 12: Jordan 4 Retro Thunder...');
});

// ============ Webhook (Stripe Pro+ Access) ============
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const metadata = event.data.object.metadata;
    if (metadata && metadata.telegram_id) {
      const userId = parseInt(metadata.telegram_id);
      vipUsers.add(userId);
      console.log(`✅ VIP Access Granted to ${userId}`);
    }
  }

  res.json({ received: true });
});

// ============ Autofetch (IMAP - Placeholder) ============
bot.command('imapsetup', (ctx) => {
  if (!vipUsers.has(ctx.from.id)) return ctx.reply('🔐 Pro+ only.');
  ctx.reply('📧 IMAP autofetch setup coming soon...\nSubmit your email + app password via /addimap');
});

// ============ Leaderboard (Placeholder) ============
bot.command('leaderboard', (ctx) => {
  ctx.reply('🥇 Leaderboard:\n1. @cookking 👟 x10\n2. @ghostcook 👟 x8\n3. @badmandee1 👟 x7');
});

// ============ Proxy & Address Features (Placeholder) ============
bot.command('addaccount', (ctx) => {
  if (!vipUsers.has(ctx.from.id)) return ctx.reply('🔐 Pro+ only.');
  ctx.reply('🧦 Please submit Nike/JD credentials like this:\n/addaccount email:pass:proxy:port');
});

// ============ Express Keepalive ============
app.get("/", (req, res) => res.send("✅ SoleSniperBot is live"));
app.listen(PORT, () => console.log("✅ Server running on port " + PORT));

bot.launch().then(() => {
  console.log('🤖 SoleSniperBot is polling...');
});