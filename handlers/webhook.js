const fs = require('fs');
const path = require('path');

module.exports = function initWebhook(bot) {
  return async function webhookHandler(req, res) {
    const sig = req.headers['stripe-signature'];
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const vipFilePath = path.join(__dirname, '../data/vip.json');

    let vipData = { vip: [], elite: [] };

    if (fs.existsSync(vipFilePath)) {
      vipData = JSON.parse(fs.readFileSync(vipFilePath, 'utf8'));
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('❌ Webhook signature verification failed.', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const amount = session.amount_total;
      const telegramId = session.client_reference_id;

      let tier = '';
      if (amount >= 40000) {
        tier = 'elite';
      } else if (amount >= 25000) {
        tier = 'vip';
      }

      if (tier && telegramId) {
        if (!vipData[tier].includes(telegramId)) {
          vipData[tier].push(telegramId);
          fs.writeFileSync(vipFilePath, JSON.stringify(vipData, null, 2));
          try {
            await bot.telegram.sendMessage(
              telegramId,
              `✅ Payment received! You’ve been added as a *${tier.toUpperCase()}* member!`,
              { parse_mode: 'Markdown' }
            );
            console.log(`✅ Added ${telegramId} to ${tier}`);
          } catch (err) {
            console.error('❌ Failed to message user:', err.message);
          }
        }
      }
    }

    res.sendStatus(200);
  };
};
