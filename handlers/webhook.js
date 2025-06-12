const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = (vipUsers, vipFilePath, bot) => async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const telegramId = session.client_reference_id;
    const amount = session.amount_total / 100;

    if (telegramId) {
      const isElite = amount >= 400;
      const isVip = amount >= 250;

      if (isElite && !vipUsers.elite.includes(telegramId)) {
        vipUsers.elite.push(telegramId);
      } else if (isVip && !vipUsers.vip.includes(telegramId)) {
        vipUsers.vip.push(telegramId);
      }

      // Save updated VIP data
      try {
        fs.writeFileSync(vipFilePath, JSON.stringify(vipUsers, null, 2));
      } catch (err) {
        console.error('❌ Failed to save VIP data:', err.message);
      }

      // Notify user
      const status = isElite ? 'Elite VIP' : 'VIP';
      try {
        await bot.telegram.sendMessage(
          telegramId,
          `✅ Payment received! You’ve been added as a *${status}* user.`,
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        console.error('❌ Failed to message user:', err.message);
      }
    }
  }

  res.status(200).end();
};
