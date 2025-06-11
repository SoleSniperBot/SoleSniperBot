const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const VIP_FILE_PATH = path.join(__dirname, '../Data/Vip.json');

// Helper to save VIP data
function saveVip(userId, tier) {
  let vipData = {};
  if (fs.existsSync(VIP_FILE_PATH)) {
    vipData = JSON.parse(fs.readFileSync(VIP_FILE_PATH));
  }

  vipData[userId] = tier;

  fs.writeFileSync(VIP_FILE_PATH, JSON.stringify(vipData, null, 2));
}

// Main webhook handler
function registerWebhookRoute(app) {
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
      const amountPaid = session.amount_total / 100;
      const userId = parseInt(session.client_reference_id);

      if (!userId) {
        console.warn('⚠️ Missing client_reference_id in session.');
        return res.sendStatus(200);
      }

      if (amountPaid === 250) {
        saveVip(userId, 'vip');
        console.log(`✅ VIP unlocked for user ${userId}`);
      } else if (amountPaid === 400) {
        saveVip(userId, 'elite');
        console.log(`👑 Elite Pro+ unlocked for user ${userId}`);
      } else {
        console.warn(`⚠️ Unknown payment amount: £${amountPaid}`);
      }
    }

    res.sendStatus(200);
  });
}

module.exports = registerWebhookRoute;
