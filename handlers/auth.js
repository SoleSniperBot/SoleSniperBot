// handlers/auth.js
const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

const vipPath = path.join(__dirname, '../data/vip.json');

function getUserTier(userId) {
  if (!fs.existsSync(vipPath)) return 'Free';

  const vipData = JSON.parse(fs.readFileSync(vipPath));
  const uid = String(userId);

  if (vipData.elite && vipData.elite.includes(uid)) return 'Elite';
  if (vipData.vip && vipData.vip.includes(uid)) return 'VIP';

  return 'Free';
}

module.exports = (ctx) => {
  const tier = getUserTier(ctx.from.id);

  let buttons = [
    [Markup.button.callback('📦 Start Checkout', 'start_checkout')],
    [Markup.button.callback('👤 Profiles', 'manage_profiles')],
    [Markup.button.callback('💳 Cards', 'manage_cards')],
    [Markup.button.callback('📄 FAQ', 'view_faq')],
  ];

  if (tier === 'Elite') {
    buttons.push([Markup.button.callback('👑 Elite Monitor', 'elite_monitor')]);
    buttons.push([Markup.button.callback('🔥 Cook Tracker', 'view_cooktracker')]);
  } else if (tier === 'VIP') {
    buttons.push([Markup.button.callback('🧪 VIP Monitor', 'vip_monitor')]);
  }

  ctx.reply(
    `👋 Welcome to SoleSniperBot!\n\nYour access level: *${tier}*\n\nUse the buttons below to begin:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons),
    }
  );
};
