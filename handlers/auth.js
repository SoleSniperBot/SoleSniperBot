// handlers/auth.js
const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

const vipPath = path.join(__dirname, '../data/vip.json');

function getUserTier(userId) {
  if (!fs.existsSync(vipPath)) {
    return 'Free';
  }

  const data = JSON.parse(fs.readFileSync(vipPath));
  if (data.vip.includes(userId.toString())) return 'VIP';
  if (data.elite.includes(userId.toString())) return 'Elite';
  return 'Free';
}

module.exports = (ctx) => {
  const userId = ctx.from.id;
  const tier = getUserTier(userId);

  let buttons = [
    [Markup.button.callback('📦 Start Checkout', 'start_checkout')],
    [Markup.button.callback('👤 Profiles', 'manage_profiles')],
    [Markup.button.callback('📄 FAQ', 'view_faq')],
  ];

  if (tier === 'Elite') {
    buttons.push([Markup.button.callback('🧪 Early Ping Monitor', 'elite_monitor')]);
    buttons.push([Markup.button.callback('👑 Cook Tracker', 'cooktracker')]);
  } else if (tier === 'VIP') {
    buttons.push([Markup.button.callback('🧪 Early Ping Monitor', 'vip_monitor')]);
  }

  ctx.reply(
    `👋 Welcome to SoleSniperBot!\n\nYour access tier: *${tier}*\n\nUse the buttons below to get started:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons),
    }
  );
};
