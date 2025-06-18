const fs = require('fs');
const path = require('path');
const { Extra } = require('telegraf');
const proxyManager = require('../lib/proxyManager'); // ✅ Fixed path

module.exports = (bot) => {
  bot.command('checkout', async (ctx) => {
    const userId = ctx.from.id.toString();

    try {
      const proxy = proxyManager.getLockedProxy(userId);
      if (!proxy) {
        return ctx.reply('❗ No proxy assigned. Please upload proxies or contact support.');
      }

      // Mocking checkout logic
      ctx.reply(`🛒 Attempting checkout using locked proxy:\n\`${proxy}\``, { parse_mode: 'Markdown' });

      // You'd replace this with actual checkout logic...
      setTimeout(() => {
        ctx.reply('✅ Checkout simulation complete.');
      }, 2000);

    } catch (err) {
      console.error('❌ Checkout error:', err);
      ctx.reply('❌ Checkout failed. Try again or contact support.');
    }
  });
};
