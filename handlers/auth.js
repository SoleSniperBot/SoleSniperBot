const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

const vipPath = path.join(__dirname, '../data/vip.json');

if (!fs.existsSync(vipPath)) {
  fs.writeFileSync(vipPath, JSON.stringify({ vip: [], elite: [] }, null, 2));
}

module.exports = (ctx) => {
  const vipData = JSON.parse(fs.readFileSync(vipPath));
  const userId = String(ctx.from.id);
  const isVIP = vipData.vip.includes(userId);
  const isElite = vipData.elite.includes(userId);

  if (!isVIP && !isElite) {
    return ctx.reply(
      '🔒 Access Denied\n\nYou need to purchase a subscription to unlock features.',
      Markup.inlineKeyboard([
        [Markup.button.url('💳 Buy Access (£250/year)', 'https://buy.stripe.com/eVq00iepa4NB39BbgncfK00')],
        [Markup.button.url('🚀 Upgrade to Pro+ (£400/year)', 'https://buy.stripe.com/3cIfZg6WI4NBbG7dovcfK01')]
      ])
    );
  }

  const buttons = [
    [Markup.button.callback('💳 Profiles', 'profiles')],
    [Markup.button.callback('🏦 Cards', 'cards')],
    [Markup.button.callback('📦 Jig Address', 'jigaddress')],
    [Markup.button.callback('🔐 Login', 'login')],
    [Markup.button.callback('🧠 FAQ', 'faq')],
    [Markup.button.callback('📈 Leaderboard', 'leaderboard')],
    [Markup.button.callback('👟 Cook Tracker', 'cooktracker')],
    [Markup.button.callback('📦 Bulk Upload', 'bulkupload')],
    [Markup.button.callback('👀 Monitor SKUs', 'monitor')],
    [Markup.button.callback('📬 IMAP Setup', 'imap')]
  ];

  if (isElite) {
    buttons.push([Markup.button.callback('🌪 Elite Tools', 'elite_tools')]);
  }

  ctx.reply('👋 Welcome to SoleSniperBot!\n\nSelect an option:', Markup.inlineKeyboard(buttons));
};
