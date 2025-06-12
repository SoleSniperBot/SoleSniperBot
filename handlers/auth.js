// handlers/auth.js
const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

const vipPath = path.join(__dirname, '../data/vip.json');

if (!fs.existsSync(vipPath)) {
  fs.writeFileSync(vipPath, JSON.stringify({}));
}

module.exports = async (ctx) => {
  const vipData = JSON.parse(fs.readFileSync(vipPath));
  const userId = String(ctx.from.id);
  const tier = vipData[userId];

  if (tier === 'VIP' || tier === 'PRO+') {
    return ctx.reply(
      `👋 Welcome back, ${ctx.from.first_name}!\n\nYou're a *${tier}* member.\n\nUse the buttons below to begin:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📦 Checkout', callback_data: 'checkout' }],
            [{ text: '📊 Cook Tracker', callback_data: 'cooktracker' }],
            [{ text: '🧠 FAQ', callback_data: 'faq' }],
            [{ text: '🔐 Login', callback_data: 'login' }],
            [{ text: '👁 Monitor', callback_data: 'monitor' }],
            [{ text: '📅 View Calendar', callback_data: 'view_calendar' }],
            [{ text: '📈 Leaderboard', callback_data: 'leaderboard' }]
          ]
        }
      }
    );
  } else {
    return ctx.reply(
      `👋 Welcome to *SoleSniperBot*!\n\nUnlock full access to:\n• Auto-checkout\n• 2FA Bypass\n• Early Ping Monitors\n• Raffles\n• Leaderboards & more.\n\nChoose your plan below:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💎 VIP – £250/year', url: 'https://buy.stripe.com/eVq00iepa4NB39BbgncfK00' }],
            [{ text: '👑 Pro+ – £400/year', url: 'https://buy.stripe.com/3cIfZg6WI4NBbG7dovcfK01' }]
          ]
        }
      }
    );
  }
};
