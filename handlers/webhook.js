// handlers/webhook.js
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const vipPath = path.join(__dirname, '../data/vip.json');
let vipData = { vip: [], elite: [] };

// ✅ Safely parse VIP data if it exists
if (fs.existsSync(vipPath)) {
  try {
    const rawData = fs.readFileSync(vipPath);
    const parsedData = JSON.parse(rawData);
    vipData.vip = Array.isArray(parsedData.vip) ? parsedData.vip : [];
    vipData.elite = Array.isArray(parsedData.elite) ? parsedData.elite : [];
  } catch (err) {
    console.error('❌ Failed to parse VIP data:', err);
  }
}

// ✅ Stripe signature verification middleware
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

// ✅ Actual webhook logic for handling new VIP/Elite payments
const initWebhook = (bot) => {
  return async (req, res) => {
    const event = req.stripeEvent;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const amount = session.amount_total;
      const userId = parseInt(session.client_reference_id);

      if (!userId) {
        console.error('❌ Missing user ID in session.');
        return res.sendStatus(200);
      }

      const tier = amount >= 400 ? 'elite' : amount >= 250 ? 'vip' : null;
      if (!tier) {
        console.log(`❌ Unrecognized tier for amount: £${amount}`);
        return res.sendStatus(200);
      }

      if (!vipData[tier].includes(userId)) {
        vipData[tier].push(userId);
        try {
          fs.writeFileSync(vipPath, JSON.stringify(vipData, null, 2));
          console.log(`✅ Added user ${userId} to ${tier}`);
        } catch (err) {
          console.error('❌ Failed to write VIP data:', err);
        }
      }

      try {
        await bot.telegram.sendMessage(
          userId,
          `🎉 Payment received! You are now a ${
            tier === 'elite' ? '👑 Elite' : '💎 VIP'
          } member.`
        );
      } catch (err) {
        console.error('❌ Failed to send Telegram message:', err);
      }
    }

    res.sendStatus(200);
  };
};

// ✅ Clean webhook URL setup
const cleanDomain = (process.env.DOMAIN || '').trim().replace(/\/+$/, '');
const webhookUrl = `${cleanDomain}/webhook`;

const setTelegramWebhook = async (bot) => {
  try {
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`✅ Webhook set to: ${webhookUrl}`);
  } catch (err) {
    console.error('❌ Failed to set webhook:', err);
  }
};

// ✅ Export clean VIP Set
const vipUsers = new Set([
  ...(Array.isArray(vipData.vip) ? vipData.vip : []),
  ...(Array.isArray(vipData.elite) ? vipData.elite : [])
]);

module.exports = {
  webhookHandler,
  initWebhook,
  setTelegramWebhook,
  vipUsers
};
