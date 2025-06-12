// Inline button callbacks
bot.action('monitor', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('📦 Please enter the SKU(s) to monitor. Use commas to separate multiple.');
});

bot.action('cards', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('💳 To add a card, use /cards and follow the format shown.');
});

bot.action('bulkupload', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('📁 To upload Nike logins, use /bulkupload and send a .txt or .csv file.');
});

bot.action('mytier', (ctx) => {
  ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const vipData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/vip.json')));

  let tier = 'Free User 🆓';
  if (vipData.elite.includes(userId)) {
    tier = 'Elite Sniper 👑';
  } else if (vipData.vip.includes(userId)) {
    tier = 'VIP Member 💎';
  }

  ctx.reply(`🔍 Your current tier: *${tier}*`, { parse_mode: 'Markdown' });
});
