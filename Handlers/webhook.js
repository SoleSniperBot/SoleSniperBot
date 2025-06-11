const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

let vipUsers = new Set(); // Memory-based VIP list

const webhookHandler = express.raw({ type: 'application/json' });

const initWebhook = (bot) => {
  return (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Webhook signature error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const tgUserId = event.data.object.client_reference_id;

      if (tgUserId) {
        const id = parseInt(tgUserId);
        vipUsers.add(id);
        console.log(`✅ VIP access granted to Telegram user ID: ${id}`);

        // ✅ Notify user directly
        bot.telegram.sendMessage(id, '🎉 You are now a Pro+ member! All features unlocked.');
      }
    }

    res.sendStatus(200);
  };
};

module.exports = { webhookHandler, initWebhook, vipUsers };
