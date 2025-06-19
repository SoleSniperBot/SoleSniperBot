const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getRandomProxy } = require('../lib/proxyManager');
const vipUsers = require('../data/vip.json');

const monitoredSKUsPath = path.join(__dirname, '../data/jdskus.json');
if (!fs.existsSync(monitoredSKUsPath)) fs.writeFileSync(monitoredSKUsPath, '[]');

let lastStatus = {};

module.exports = (bot) => {
  // View monitored SKUs
  bot.command('jdskus', (ctx) => {
    const skus = JSON.parse(fs.readFileSync(monitoredSKUsPath));
    if (skus.length === 0) return ctx.reply('No SKUs currently being monitored.');

    const buttons = skus.map(sku => [{ text: `Remove ${sku}`, callback_data: `remove_jdsku_${sku}` }]);
    ctx.reply('Currently Monitored JD SKUs:', {
      reply_markup: { inline_keyboard: buttons }
    });
  });

  // Add SKU
  bot.command('addjdsku', (ctx) => {
    const sku = ctx.message.text.split(' ')[1];
    if (!sku) return ctx.reply('Usage:\n/addjdsku <SKU>');

    const skus = JSON.parse(fs.readFileSync(monitoredSKUsPath));
    if (!skus.includes(sku)) {
      skus.push(sku);
      fs.writeFileSync(monitoredSKUsPath, JSON.stringify(skus, null, 2));
      ctx.reply(`JD SKU ${sku} is now being monitored.`);
    } else {
      ctx.reply(`JD SKU ${sku} is already being monitored.`);
    }
  });

  // Remove SKU via button
  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    if (data.startsWith('remove_jdsku_')) {
      const sku = data.replace('remove_jdsku_', '');
      let skus = JSON.parse(fs.readFileSync(monitoredSKUsPath));
      skus = skus.filter(s => s !== sku);
      fs.writeFileSync(monitoredSKUsPath, JSON.stringify(skus, null, 2));
      await ctx.answerCbQuery(`Removed ${sku}`);
      await ctx.editMessageText(`Removed JD SKU: ${sku}`);
    }
  });

  // Monitor loop
  setInterval(async () => {
    const skus = JSON.parse(fs.readFileSync(monitoredSKUsPath));
    for (const sku of skus) {
      try {
        const proxy = getRandomProxy();
        const agent = proxy ? { httpsAgent: proxy } : {};
        const url = `https://www.jdsports.co.uk/product/${sku}`;
        const res = await axios.get(url, agent);
        const available = !res.data.includes('Out of Stock');

        if (available && !lastStatus[sku]) {
          lastStatus[sku] = true;
          for (const userId of vipUsers.vip || []) {
            await bot.telegram.sendMessage(userId, `JD Restock Alert\nSKU: ${sku}\nLink: ${url}`);
          }
        } else if (!available) {
          lastStatus[sku] = false;
        }
      } catch (err) {
        console.error(`JD Monitor Error for ${sku}:`, err.message);
      }
    }
  }, 20000);
};
