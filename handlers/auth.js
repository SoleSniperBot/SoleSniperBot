// handlers/auth.js
const fs = require('fs');
const path = require('path');

const vipPath = path.join(__dirname, '../data/vip.json');
if (!fs.existsSync(vipPath)) {
  fs.writeFileSync(vipPath, JSON.stringify({}));
}

module.exports = async (ctx) => {
  const userId = String(ctx.from.id);
  const vipData = JSON.parse(fs.readFileSync(vipPath));
  const isVIP = vipData[userId]?.tier === 'elite' || vipData[userId]?.tier === 'vip';

  if (!isVIP) {
    return ctx.reply(`👋 Welcome to *SoleSniperBot*\n\nThis is a premium bot for auto-checkout on Nike, SNKRS, JD, and more.\n\n💎 *Features:*\n- Early SNKRS drop monitor\n- Auto-checkout Nike + JD\n- Add 100+ accounts\n- Jig addresses + save profiles\n- Built-in calendar + card storage\n\n🔐 To unlock full access, purchase your plan:\n\n💰 *VIP Access* (£250/yr): https://buy.stripe.com/eVq00iepa4NB39BbgncfK00\n💰 *Elite Pro+* (£400/yr): https://buy.stripe.com/3cIfZg6WI4NBbG7dovcfK01\n\nOnce payment is made, you’ll be upgraded automatically.\n\n✅ Already paid? Just type /start again in 2–5 mins.`,
      { parse_mode: 'Markdown' }
    );
  }

  ctx.reply(`🎉 You have VIP access!\n\nUse the commands below to get started:\n\n/checkout – Add items to checkout\n/profiles – Manage your checkout profiles\n/cards – Save your payment methods\n/bulkupload – Upload Nike accounts + proxies\n/login – Log into Nike accounts\n/imap – Auto-fetch Nike 2FA codes\n/monitor – SKU monitor + calendar\n/leaderboard – View top users\n/faq – Help + setup`);
};
