const fs = require('fs');
const path = require('path');
const vipData = require('../data/vip.json'); // ✅ corrected lowercase path

module.exports = (bot) => {
  bot.command('checkvip', (ctx) => {
    const userId = ctx.from.id.toString();
    const isVip = vipData.vip.includes(userId);
    const isElite = vipData.elite.includes(userId);

    if (isElite) {
      ctx.reply('👑 You are an Elite Member.');
    } else if (isVip) {
      ctx.reply('✅ You are a Pro+ Sniper.');
    } else {
      ctx.reply('❌ You are not a VIP yet. Use /upgrade to get access.');
    }
  });
};
