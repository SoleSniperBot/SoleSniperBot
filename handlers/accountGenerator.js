const fs = require('fs');
const path = require('path');
const { createNikeAccount } = require('../lib/nikeApi');
const { generateRandomEmail } = require('../utils/helpers'); // Assumes you have a helper
const vipData = require('../data/vip.json');

const password = process.env.NIKE_PASS; // should be set to "airmax123!" in .env
const proxyList = require('../data/proxies.json'); // assumed to be a list of working proxies

function getRandomProxy() {
  return proxyList[Math.floor(Math.random() * proxyList.length)];
}

module.exports = (bot) => {
  bot.command('bulkgen', async (ctx) => {
    const userId = ctx.from.id.toString();

    if (!vipData[userId]) {
      return ctx.reply('⛔ You are not a VIP user. Please subscribe to use this feature.');
    }

    const args = ctx.message.text.split(' ');
    const count = parseInt(args[1], 10);

    if (![5, 10, 15].includes(count)) {
      return ctx.reply('⚠️ Please specify a valid amount: 5, 10, or 15\nExample: /bulkgen 5');
    }

    await ctx.reply(`🔁 Generating ${count} Nike accounts...`);
    const accounts = [];

    for (let i = 0; i < count; i++) {
      const email = generateRandomEmail(); // like mark.phillips1234@gmail.com
      const proxy = getRandomProxy();

      console.log(`\n📧 Starting account ${i + 1}/${count}: ${email}`);
      console.log(`🔌 Proxy: ${proxy}`);

      const result = await createNikeAccount(email, password, proxy);

      if (result.success) {
        accounts.push({ email, password });
        console.log(`✅ Created: ${email}`);
      } else {
        console.log(`❌ Failed for ${email} — Reason: ${result.error}`);
      }
    }

    // Save created accounts
    const filePath = path.join(__dirname, `../data/generated_${Date.now()}.txt`);
    const content = accounts.map(a => `${a.email}:${a.password}`).join('\n');
    fs.writeFileSync(filePath, content);

    await ctx.replyWithDocument({ source: filePath, filename: 'nike_accounts.txt' });
    console.log(`📦 Done. Total successful: ${accounts.length}/${count}`);
  });
};
