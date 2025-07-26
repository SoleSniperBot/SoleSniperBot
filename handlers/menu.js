const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const generateNikeAccount = require('../lib/generateNikeAccount');
const vipPath = path.join(__dirname, '../data/vip.json');
const profilesPath = path.join(__dirname, '../data/profiles.json');

if (!fs.existsSync(vipPath)) fs.writeFileSync(vipPath, JSON.stringify({}));
if (!fs.existsSync(profilesPath)) fs.writeFileSync(profilesPath, JSON.stringify({}));

function getUserTier(userId) {
  const vipList = JSON.parse(fs.readFileSync(vipPath));
  return vipList[userId] ? 'vip' : 'free';
}

module.exports = (bot) => {
  bot.command('menu', (ctx) => {
    const userId = String(ctx.from.id);
    const tier = getUserTier(userId);

    ctx.reply(`👋 Welcome to SoleSniperBot\n\nYour Tier: ${tier === 'vip' ? '🔥 VIP' : '🆓 Free'}`, Markup.inlineKeyboard([
      [Markup.button.callback('📦 View My Accounts', 'my_accounts')],
      [Markup.button.callback('⚙️ Generate Nike Accounts', 'accountgen_inline')],
      [Markup.button.callback('👟 Add Profile (Card + Address)', 'add_profile')],
      [Markup.button.callback('🚀 Checkout SKU', 'start_checkout')],
      [Markup.button.callback('📅 Upcoming Drops', 'view_calendar')],
    ]));
  });

  bot.action('accountgen_inline', async (ctx) => {
    const userId = String(ctx.from.id);
    const vipList = JSON.parse(fs.readFileSync(vipPath));
    if (!vipList[userId]) {
      return ctx.answerCbQuery('❌ VIP access only. Upgrade to unlock.', { show_alert: true });
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText('⚙️ Choose how many accounts to generate:', Markup.inlineKeyboard([
      [Markup.button.callback('5 Accounts', 'gen_5')],
      [Markup.button.callback('10 Accounts', 'gen_10')],
      [Markup.button.callback('15 Accounts', 'gen_15')],
    ]));
  });

  bot.action(/^gen_(\d+)/, async (ctx) => {
    const userId = String(ctx.from.id);
    const count = parseInt(ctx.match[1]);

    await ctx.editMessageText(`⏳ Generating ${count} accounts...`);
    for (let i = 0; i < count; i++) {
      const acc = await generateNikeAccount(userId);
      if (acc) {
        ctx.reply(`✅ Account Created:\n📧 ${acc.email}\n🔑 ${acc.password}`);
      } else {
        ctx.reply(`❌ Account ${i + 1} failed. Moving to next...`);
      }
    }
  });

  bot.action('my_accounts', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply('📦 Feature under construction: My Accounts.');
  });

  bot.action('view_calendar', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply('📅 Feature under construction: Upcoming Drops.');
  });

  bot.action('add_profile', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply('📝 Send your profile in this format:\n\n`Full Name | Address | City | Postcode | Phone | CardNumber | ExpiryMM/YY | CVV`\n\nExample:\n`John Doe | 10 Downing St | London | SW1A 2AA | +447700900000 | 4242424242424242 | 12/28 | 123`', {
      parse_mode: 'Markdown'
    });
  });

  bot.on('text', async (ctx) => {
    const userId = String(ctx.from.id);
    const text = ctx.message.text;

    if (text.includes('|')) {
      const parts = text.split('|').map(p => p.trim());
      if (parts.length !== 8) return ctx.reply('❌ Invalid format. Make sure you use 8 fields.');

      const [fullName, address, city, postcode, phone, card, expiry, cvv] = parts;
      const [firstName, ...rest] = fullName.split(' ');
      const lastName = rest.join(' ');

      const profiles = JSON.parse(fs.readFileSync(profilesPath));
      if (!profiles[userId]) profiles[userId] = [];

      profiles[userId].push({
        firstName,
        lastName,
        address,
        city,
        postcode,
        phone,
        cardNumber: card,
        expiry,
        cvv
      });

      fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
      ctx.reply('✅ Profile saved successfully.');
    }
  });

  bot.action('start_checkout', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply('👟 Enter your checkout in this format:\n`/checkout <SKU> <Size>`\n\nExample:\n`/checkout FJ1234-001 10`', {
      parse_mode: 'Markdown'
    });
  });
};
