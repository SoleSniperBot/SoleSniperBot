const { getLockedProxy } = require('../lib/proxyManager');
const { getUserProfile } = require('../data/profileUtils');
const axios = require('axios');

module.exports = (bot) => {
  bot.command('jdcheckout', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const sku = args[0];

    if (!sku) {
      return ctx.reply('Please provide a SKU. Example:\n/jdcheckout FV5029-006');
    }

    const proxy = getLockedProxy(ctx.from.id, sku);
    if (!proxy) {
      return ctx.reply('No proxy found. Please upload working proxies first.');
    }

    const profile = getUserProfile(ctx.from.id);
    if (!profile) {
      return ctx.reply('No profile found. Please set your address and card first.');
    }

    ctx.reply(`Attempting checkout for SKU: ${sku}...`);

    try {
      // Simulate JD login and carting
      const response = await axios.post('https://mock-jd-api/checkout', {
        sku,
        profile,
        proxy
      });

      if (response.data.success) {
        ctx.reply(`Checkout submitted for SKU: ${sku} ✅`);
      } else {
        ctx.reply(`Checkout failed: ${response.data.message}`);
      }
    } catch (err) {
      console.error(err.message);
      ctx.reply('Error during JD checkout process.');
    }
  });
};
