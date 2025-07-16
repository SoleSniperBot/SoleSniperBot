const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

const vipPath = path.join(__dirname, '../data/vip.json');
if (!fs.existsSync(vipPath)) fs.writeFileSync(vipPath, JSON.stringify({}));

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

  bot.action('my_accounts', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply('📦 Feature under construction: My Accounts.');
  });

  bot.action('view_calendar', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply('📅 Feature under construction: Upcoming Drops.');
  });
};
