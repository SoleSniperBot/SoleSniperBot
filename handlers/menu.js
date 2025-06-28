const { Markup } = require('telegraf');

module.exports = (bot) => {
  // Main /start or Menu Button
  bot.command('start', async (ctx) => {
    await ctx.reply('👟 *Welcome to SoleSniperBot!*', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📥 Upload Proxies', 'upload_proxies')],
        [Markup.button.callback('👤 Add Profile', 'add_profile')],
        [Markup.button.callback('🔄 Generate Nike Accounts', 'bulkgen')],
        [Markup.button.callback('🎯 Nike Checkout', 'nike_checkout')],
        [Markup.button.callback('🛍️ JD Checkout', 'jd_checkout')],
        [Markup.button.callback('📡 Monitor SKU', 'monitor')],
        [Markup.button.callback('📊 My Proxies', 'myproxies')],
      ])
    });
  });

  // === Button Actions ===

  bot.action('upload_proxies', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📥 Please upload a `.txt` file with one proxy per line.');
  });

  bot.action('add_profile', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('👤 Please send your profile in the format:\n`Name, Address, City, Postcode, Phone, CardNumber, Exp, CVV`', { parse_mode: 'Markdown' });
  });

  bot.action('bulkgen', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🔢 Send how many Nike accounts you want to generate. Example:\n`10`', { parse_mode: 'Markdown' });

    bot.once('text', async (ctx2) => {
      const count = parseInt(ctx2.message.text);
      if (isNaN(count) || count < 1 || count > 50) {
        return ctx2.reply('❌ Please enter a number between 1 and 50.');
      }

      // Use your existing bulkgen logic here
      const bulkGen = require('./bulkgen');
      await bulkGen(bot)(ctx2, count);
    });
  });

  bot.action('nike_checkout', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('👟 Enter the Nike SKU to checkout (e.g., DV1234-001):');
  });

  bot.action('jd_checkout', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🛍️ Enter the JD Sports SKU to checkout (e.g., M123456):');
  });

  bot.action('monitor', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📡 Enter the SKU(s) you want to monitor, comma-separated if multiple.');
  });

  bot.action('myproxies', async (ctx) => {
    ctx.answerCbQuery();
    const { getAllUserProxies } = require('../lib/proxyManager');
    const userId = ctx.from.id;
    const all = getAllUserProxies(userId);
    const locked = all.filter(p => p.locked);
    const free = all.filter(p => !p.locked);

    await ctx.reply(
      `🧩 Proxy Status:\n• Total: ${all.length}\n• 🔒 Locked: ${locked.length}\n• ✅ Free: ${free.length}`
    );
  });
};
