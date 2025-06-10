const { Telegraf } = require('telegraf');
const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// In-memory VIP user tracking
let vipUsers = new Set();

// Stripe webhook handling
app.post('/webhook', (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const customerId = event.data.object.client_reference_id;
        vipUsers.add(parseInt(customerId));
    }

    res.status(200).send('Received');
});

// Bot start command
bot.start((ctx) => {
    const isVip = vipUsers.has(ctx.from.id);
    ctx.reply(isVip
        ? '👋 Welcome back, Pro+ member. You’re fully unlocked.'
        : '👋 Welcome to SoleSniperBot!\n\nUse /upgrade to unlock VIP access.');
});

// /upgrade command
bot.command('upgrade', (ctx) => {
    ctx.reply('To upgrade, pay here:\nhttps://buy.stripe.com/3cIfZg6WI4NBbG7dovcfK01');
});

// Express endpoint to verify bot is alive
app.get('/', (req, res) => {
    res.send('SoleSniperBot is running.');
});

bot.launch();
app.listen(PORT, () => {
    console.log(`Server live on http://localhost:${PORT}`);
});
