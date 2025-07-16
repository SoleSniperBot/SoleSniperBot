const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const { createNikeAccount } = require('../lib/nikeApi');

const vipPath = path.join(__dirname, '../data/vip.json');
if (!fs.existsSync(vipPath)) fs.writeFileSync(vipPath, JSON.stringify({}));

function getUserTier(userId) {
  const vipList = JSON.parse(fs.readFileSync(vipPath));
  return vipList[userId] ? 'vip' : 'free';
}

module.exports = (bot) => {
  const generate = async (ctx, amount) => {
    const userId = String(ctx.from.id);
    const vipList = JSON.parse(fs.readFileSync(vipPath));
    if (!vipList[userId]) {
      return ctx.reply('❌ VIP only. Upgrade required.');
    }

    ctx.reply(`⚙️ Starting creation of ${amount} Nike accounts...`);

    for (let i = 0; i < amount; i++) {
      const email = `solesniper+${Date.now() + i}@gmail.com`;
      const password = process.env.NIKE_PASSWORD || 'airmax123!';
      const proxy = process.env.GEONODE_PROXY; // should be in format http://user:pass@ip:port

      console.log(`🌐 Using proxy: ${proxy}`);
      console.log(`⚙️ Creating: ${email}`);

      try {
        const result = await createNikeAccount(email, password, proxy);
        if (result.success) {
          console.log(`✅ Account created: ${email}`);
        } else {
          console.log(`❌ Failure: ${email} | Error: ${result.error}`);
        }
      } catch (err) {
        console.log(`❌ Error for ${email}: ${err.message}`);
      }
    }
  };

  bot.action('gen_5', async (ctx) => {
    await ctx.answerCbQuery();
    await generate(ctx, 5);
  });

  bot.action('gen_10', async (ctx) => {
    await ctx.answerCbQuery();
    await generate(ctx, 10);
  });

  bot.action('gen_15', async (ctx) => {
    await ctx.answerCbQuery();
    await generate(ctx, 15);
  });
};
