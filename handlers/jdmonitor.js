const fs = require('fs');
const path = require('path');

const skuPath = path.join(__dirname, '../data/jdskus.json');

function saveSKU(sku) {
  let skus = [];
  if (fs.existsSync(skuPath)) {
    skus = JSON.parse(fs.readFileSync(skuPath));
  }
  if (!skus.includes(sku)) {
    skus.push(sku);
    fs.writeFileSync(skuPath, JSON.stringify(skus, null, 2));
    return true;
  }
  return false;
}

module.exports = (bot) => {
  // Button trigger
  bot.command('jdskus', (ctx) => {
    ctx.reply('Select an option below:', {
      reply_markup: {
        inline_keyboard: [[
          { text: '➕ Add JD SKU', callback_data: 'add_jd_sku' }
        ]]
      }
    });
  });

  // Handle button tap
  bot.action('add_jd_sku', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('Please enter the SKU you want to monitor (e.g., FV5029-006):');
    bot.once('text', (msgCtx) => {
      const sku = msgCtx.message.text.trim();
      const success = saveSKU(sku);
      if (success) {
        msgCtx.reply(`✅ Added SKU: ${sku} to JD monitor list.`);
      } else {
        msgCtx.reply(`⚠️ SKU ${sku} is already being monitored.`);
      }
    });
  });
};
