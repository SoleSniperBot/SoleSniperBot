const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const vipFilePath = path.join(__dirname, '../data/vip.json');

let vipData = { vip: [], elite: [] };
if (fs.existsSync(vipFilePath)) {
  vipData = JSON.parse(fs.readFileSync(vipFilePath, 'utf8'));
}

const webhookHandler = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  req.stripeEvent = event;
  next();
};

const initWebhook = (bot) => async (req, res) => {
  const event = req.stripeEvent;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const amount = session.amount_total / 100;
    const userId = parseInt(session.client_reference_id);

    const tier = amount >= 400 ? 'elite' : amount >= 250 ? 'vip' : null;
    if (!tier || !userId) return res.sendStatus(200);

    if (!vipData[tier].includes(userId)) {
      vipData[tier].push(userId);
      fs.writeFileSync(vipFilePath, JSON.stringify(vipData, null, 2));
      console.log(`✅ Added ${userId} to ${tier}`);
    }

    try {
      await bot.telegram.sendMessage(userId, `🎉 Payment received! You’ve been added as a ${tier === 'elite' ? '👑 Elite Member' : 'Pro+ Sniper'}`);
    } catch (err) {
      console.error('❌ Failed to message user:', err.message);
    }
  }

  res.sendStatus(200);
};

module.exports = {
  webhookHandler,
  initWebhook,
  vipUsers: new Set([...vipData.vip, ...vipData.elite])
};
