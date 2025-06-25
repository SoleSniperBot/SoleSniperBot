// handlers/webhook.js
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const vipPath = path.join(__dirname, '../data/vip.json');

// Load or initialize VIP list from JSON file
let vipData = { vip: [], elite: [] };
if (fs.existsSync(vipPath)) {
  try {
    vipData = JSON.parse(fs.readFileSync(vipPath, 'utf8'));
  } catch (err) {
    console.error('❌ Failed to parse vip.json:', err.message);
  }
}

// Middleware to verify Stripe webhook signature and parse event
const webhookHandler = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  req.stripeEvent = event;
  next();
};

// Actual webhook event handler
const initWebhook = (bot) => {
  return async (req, res) => {
    const event = req.stripeEvent;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const amount = session.amount_total / 100; // convert from pence to pounds
      const userId = parseInt(session.client_reference_id);

      if (!userId) {
        console.error('❌ Missing client_reference_id in session');
        return res.sendStatus(200);
      }

      // Determine user tier by amount paid
      const tier = amount >= 400 ? 'elite' : amount >= 250 ? 'vip' : null;
      if (!tier) {
        console.log(`❌ Unrecognized payment amount: £${amount}`);
        return res.sendStatus(200);
      }

      // Add user to VIP or Elite list if not already included
      if (!vipData[tier].includes(userId)) {
        vipData[tier].push(userId);
        try {
          fs.writeFileSync(vipPath, JSON.stringify(vipData, null, 2));
          console.log(`✅ Added user ${userId} to ${tier} tier`);
        } catch (err) {
          console.error('❌ Failed to save vip.json:', err.message);
        }
      }

      // Notify user on Telegram
      try {
        await bot.telegram.sendMessage(
          userId,
          `🎉 Payment received! You’ve been added as a ${
            tier === 'elite' ? '👑 Elite Member' : 'Pro+ Sniper'
          }`
        );
      } catch (err) {
        console.error('❌ Failed to send Telegram message:', err.message);
      }
    }

    res.sendStatus(200);
  };
};

// Export handlers and VIP users set for other modules
module.exports = {
  webhookHandler,
  initWebhook,
  vipUsers: new Set([...vipData.vip, ...vipData.elite]),
};
