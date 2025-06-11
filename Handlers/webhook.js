const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Load VIPs from Vip.json
const vipPath = path.join(__dirname, '../Data/Vip.json');
let vipData = JSON.parse(fs.readFileSync(vipPath, 'utf8'));
let vipUsers = new Set(vipData.vip);

// Save function
function saveVipData() {
  fs.writeFileSync(vipPath, JSON.stringify({ vip: [...vipUsers] }, null, 2));
}

// Webhook middleware
const webhookHandler = (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  req.stripeEvent = event;
  next();
};

// Handle webhook event
const initWebhook = (bot) => async (req, res) => {
  const event = req.stripeEvent;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const amount = session.amount_total / 100;
    const userId = parseInt(session.client_reference_id);

    if (!vipUsers.has(userId)) {
      vipUsers.add(userId);
      saveVipData();
    }

    const tier = amount >= 400 ? 'Elite 💎' : 'Pro+';
    const message = `✅ Thank you for upgrading!\nYour VIP access (${tier}) is now active.\n\nUse /start to unlock full features.`;

    try {
      await bot.telegram.sendMessage(userId, message);
    } catch (err) {
      console.error(`⚠️ Could not message Telegram user ${userId}`, err.message);
    }

    console.log(`✅ VIP assigned: ${userId} [${tier}]`);
  }

  res.status(200).send('Webhook received');
};

module.exports = {
  webhookHandler,
  initWebhook,
  vipUsers
};
