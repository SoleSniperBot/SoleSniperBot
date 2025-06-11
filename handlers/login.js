const fs = require('fs');
const path = require('path');
const { isVip } = require('./auth');

const loginFile = path.join(__dirname, '../Data/Login.json');

function saveLoginData(userId, accountData) {
    let logins = {};
    if (fs.existsSync(loginFile)) {
        logins = JSON.parse(fs.readFileSync(loginFile));
    }
    logins[userId] = accountData;
    fs.writeFileSync(loginFile, JSON.stringify(logins, null, 2));
}

module.exports = async (bot) => {
    bot.command('login', async (ctx) => {
        if (!(await isVip(ctx))) return;

        const userId = String(ctx.from.id);
        ctx.reply('Send your login in this format:\n\nEmail|Password');

        bot.once('text', async (ctx2) => {
            const [email, password] = ctx2.message.text.split('|');
            if (!email || !password) {
                return ctx2.reply('❌ Invalid format. Please use:\nEmail|Password');
            }

            const accountData = { email, password };
            saveLoginData(userId, accountData);
            ctx2.reply('✅ Login saved for auto login.');
        });
    });
};
