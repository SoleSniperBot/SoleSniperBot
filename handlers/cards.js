const fs = require('fs');
const path = require('path');
const { isVip } = require('./auth');

const cardFile = path.join(__dirname, '../Data/Cards.json');

function saveCard(userId, cardData) {
    let cards = {};
    if (fs.existsSync(cardFile)) {
        cards = JSON.parse(fs.readFileSync(cardFile));
    }
    cards[userId] = cardData;
    fs.writeFileSync(cardFile, JSON.stringify(cards, null, 2));
}

module.exports = async (bot) => {
    bot.command('savecard', async (ctx) => {
        if (!(await isVip(ctx))) return;

        const userId = String(ctx.from.id);
        ctx.reply('Send your card details in this format:\n\nCardNumber|MM/YY|CVV');

        bot.once('text', async (ctx2) => {
            const [number, expiry, cvv] = ctx2.message.text.split('|');
            if (!number || !expiry || !cvv) {
                return ctx2.reply('❌ Invalid format. Please use:\nCardNumber|MM/YY|CVV');
            }

            const cardData = { number, expiry, cvv };
            saveCard(userId, cardData);
            ctx2.reply('✅ Card saved to profile.');
        });
    });
};
