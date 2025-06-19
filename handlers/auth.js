const { Markup } = require('telegraf');

bot.action('fetch_proxies', async (ctx) => {
  await ctx.answerCbQuery(); // closes Telegram's loading spinner
  ctx.reply('🔍 Scraping fresh UK SOCKS5 proxies...');

  try {
    const response = await axios.get('https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt');
    const proxies = response.data.trim().split('\n');
    const selected = proxies.slice(0, 50);

    const filePath = path.join(__dirname, '../data/proxies.json');
    fs.writeFileSync(filePath, JSON.stringify(selected, null, 2));

    ctx.reply(`✅ ${selected.length} UK SOCKS5 proxies scraped & saved.`);
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Failed to fetch proxies. Please try again later.');
  }
});
module.exports = (bot) => {
  bot.start(async (ctx) => {
    await ctx.reply(
      'Use the buttons below to get started.',
      Markup.inlineKeyboard([
        [Markup.button.callback('📦 Start Monitoring', 'start_monitor')],
        [Markup.button.callback('🔌 Fetch Proxies', 'fetch_proxies')]
        [Markup.button.callback('📅 Calendar', 'calendar')],
        [Markup.button.callback('💳 Add Card', 'add_card')],
        [Markup.button.callback('📂 Upload Accounts', 'upload_accounts')],
        [Markup.button.callback('📊 My Tier', 'my_tier')]
      ])
    );
  });

  bot.action('start_monitor', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('📡 Fetching upcoming Nike SNKRS drops...');
    
    try {
      const { fetchSnkrsUpcoming } = require('../lib/dropFetchers');
      const upcoming = await fetchSnkrsUpcoming();

      if (!upcoming.length) {
        return ctx.reply('❌ No upcoming drops found.');
      }

      for (const drop of upcoming) {
        await ctx.replyWithMarkdown(
          `👟 *${drop.name}*\n🆔 SKU: \`${drop.sku}\`\n📅 Release: ${drop.releaseDate}`
        );
      }
    } catch (err) {
      console.error('❌ Failed to fetch drops:', err.message);
      await ctx.reply('⚠️ Something went wrong. Try again later.');
    }
  });
};
