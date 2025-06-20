const { Markup } = require('telegraf');

module.exports = (bot) => {
  // /start command with inline keyboard
  bot.start(async (ctx) => {
    await ctx.reply(
      'Use the buttons below to get started.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔭 Fetch Proxies', 'REFRESH_PROXIES')],
        [Markup.button.callback('👀 View Proxies', 'VIEW_PROXIES')],
        [Markup.button.callback('📘 FAQ', 'faq')],
        [Markup.button.callback('📦 Start Monitoring', 'start_monitor')],
        [Markup.button.callback('📅 Calendar', 'calendar')],
        [Markup.button.callback('💳 Add Card', 'add_card')],
        [Markup.button.callback('📂 Upload Accounts', 'upload_accounts')],
        [Markup.button.callback('📊 My Tier', 'view_tier')]
      ])
    );
  });

  // /faq command
  bot.command('faq', async (ctx) => {
    await ctx.replyWithMarkdownV2(`*SoleSniper FAQ 📖*\n\n\
Here are some common questions and answers:\n
*1\\. How do I start monitoring drops\\?*  
Use the *Start Monitoring* button to begin tracking SNKRS/JD/Nike releases\.

*2\\. How do I add my cards or addresses\\?*  
Tap *Add Card* or *Upload Accounts* to attach your checkout info\.

*3\\. Where do I fetch proxies from\\?*  
Click *Fetch Proxies* and they'll be automatically saved and ready\.

*4\\. Can I view saved proxies\\?*  
Yes\\! Click *View Proxies* to see what’s saved\.

*5\\. I need help — who can I contact\\?*  
Message *[Support](https://t.me/badmandee1)* on Telegram for help or questions\.`);
  });

  // Inline FAQ button action
  bot.action('faq', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.telegram.sendMessage(ctx.chat.id, `/faq — tap or type this to open help`);
  });
};
