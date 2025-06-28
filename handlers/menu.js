module.exports = (bot) => {
  bot.command('start', (ctx) => {
    return ctx.reply('👟 Welcome to SoleSniperBot\nChoose an action below:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👤 Generate Accounts', callback_data: 'generate_accounts' }],
          [{ text: '📥 Upload Proxies', callback_data: 'upload_proxies' }],
          [{ text: '🔍 Check Accounts', callback_data: 'check_accounts' }],
          [{ text: '🛒 Start Checkout', callback_data: 'start_checkout' }],
          [{ text: '🧾 My Proxies & Tier', callback_data: 'my_info' }],
        ]
      }
    });
  });

  // 👤 Account Generation
  bot.action('generate_accounts', async (ctx) => {
    ctx.answerCbQuery();
    return ctx.reply('📌 Enter how many accounts you want to generate.\nExample: `/bulkgen 5`', { parse_mode: 'Markdown' });
  });

  // 📥 Proxy Upload
  bot.action('upload_proxies', async (ctx) => {
    ctx.answerCbQuery();
    return ctx.reply('📌 Send your proxies in this format:\nip:port\nip:port:username:password (if needed)\n1 per line.');
  });

  // 🔍 Account Checker
  bot.action('check_accounts', async (ctx) => {
    ctx.answerCbQuery();
    return ctx.reply('🧪 Account check coming soon. You’ll be able to validate Nike account health.');
  });

  // 🛒 Checkout
  bot.action('start_checkout', async (ctx) => {
    ctx.answerCbQuery();
    return ctx.reply('🛍️ To begin checkout, send the SKU or use inline options from upcoming drops.');
  });

  // 🧾 My Info
  bot.action('my_info', async (ctx) => {
    const tier = ctx.session?.tier || 'Free';
    const userId = ctx.from.id;
    // Add proxy status fetch later
    return ctx.reply(`🔐 Your Telegram ID: \`${userId}\`\n💎 Tier: *${tier}*`, { parse_mode: 'Markdown' });
  });
};
