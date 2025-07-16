const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { createNikeAccount } = require('../lib/nikeApi');

const generatedPath = path.join(__dirname, '../data/generated_accounts.json');
if (!fs.existsSync(generatedPath)) fs.writeFileSync(generatedPath, JSON.stringify({}));

module.exports = (bot) => {
  bot.action('gen_5', async (ctx) => generateAccounts(ctx, 5));
  bot.action('gen_10', async (ctx) => generateAccounts(ctx, 10));
  bot.action('gen_15', async (ctx) => generateAccounts(ctx, 15));
};

async function generateAccounts(ctx, amount) {
  const userId = String(ctx.from.id);
  const nikePassword = process.env.NIKE_PASSWORD;
  const accounts = [];

  await ctx.answerCbQuery();
  await ctx.editMessageText(`⏳ Generating ${amount} Nike accounts...\nProgress will appear below.`);

  for (let i = 0; i < amount; i++) {
    const proxy = await getLockedProxy(userId);
    if (!proxy) {
      ctx.reply(`❌ No proxy available for account ${i + 1}`);
      console.warn(`❌ No proxy available for user ${userId} (account ${i + 1})`);
      continue;
    }

    const email = `snipe${Date.now()}${Math.floor(Math.random() * 1000)}@gmail.com`;

    try {
      const result = await createNikeAccount(email, nikePassword, proxy);

      if (result.success) {
        ctx.reply(`✅ Account ${i + 1} created: ${email}`);
        console.log(`✅ Account created: ${email} using proxy: ${proxy}`);

        // Save account
        saveGeneratedAccount(userId, email);
        accounts.push(email);
      } else {
        ctx.reply(`❌ Account ${i + 1} failed: ${result.error || 'Unknown error'}`);
        console.error(`❌ Account failed: ${email} using proxy: ${proxy} — ${result.error}`);
      }

    } catch (err) {
      ctx.reply(`⚠️ Error creating account ${i + 1}: ${err.message}`);
      console.error(`⚠️ Exception for ${email} on proxy ${proxy}: ${err.message}`);
    } finally {
      await releaseLockedProxy(userId);
    }
  }

  if (accounts.length === 0) {
    ctx.reply('❌ No accounts created successfully.');
  } else {
    ctx.reply(`🎉 ${accounts.length} Nike accounts generated successfully.`);
  }
}

function saveGeneratedAccount(userId, email) {
  const file = path.join(__dirname, '../data/generated_accounts.json');
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {};
  if (!data[userId]) data[userId] = [];
  data[userId].push(email);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
