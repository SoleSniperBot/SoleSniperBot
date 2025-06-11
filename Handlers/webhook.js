const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const vipFile = path.join(__dirname, '../Data/Vip.json');

let vipUsers = new Set();

// Load existing VIPs from Vip.json
if (fs.existsSync(vipFile)) {
  try {
    const data = fs.readFileSync(vipFile);
    const json = JSON.parse(data);
    vipUsers = new Set(json.vip);
  } catch (err) {
    console.error('❌ Failed to read VIP file:', err);
  }
}

// Save updated VIP list to file
function saveVipFile() {
  fs.writeFileSync(vipFile, JSON.stringify({ vip: Array.from(vipUsers) }, null, 2));
}

// Handle Stripe webhook events
const webhookHandler = (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Stripe Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  req.stripeEvent = event;
  next();
};

// Init logic to process webhook after verification
const initWebhook = (bot) => async (req, res) => {
  const event = req.stripeEvent;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const amount = session.amount_total / 100;
    const userId = parseInt(session.client_reference_id);

    if (!userId) return res.sendStatus(200);

    if (amount === 250 || amount === 400) {
      vipUsers.add(userId);
      saveVipFile();

      bot.telegram.sendMessage(
        userId,
        amount === 400
          ? '🎉 You’re now an ELITE Pro+ Sniper! All features unlocked.'
          : '✅ Payment received. You’re now a VIP sniper!'
      );
    }
  }

  res.sendStatus(200);
};

module.exports = {
  webhookHandler,
  initWebhook,
  vipUsers
};
