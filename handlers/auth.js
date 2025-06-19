const { Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = (bot) => {
  // Inline button action to fetch fresh UK SOCKS5 proxies
  bot.action('fetch_proxies', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply('🔍 Scraping fresh UK SOCKS5 proxies...');

    try {
      const response = await axios.get('https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks5.txt');
      const proxies = response.data.trim().split('\n');
      const selected = proxies.slice(0, 50);

      const filePath = path.join(__dirname, '../data/proxies.json');
      fs.writeFileSync(filePath, JSON.stringify(selected, null, 2));

      ctx.reply(`✅ ${selected.length} UK proxies saved.`);
    } catch (error) {
      console.error(error);
      ctx.reply('❌ Failed to fetch proxies.');
    }
  });

  // Bot startup greeting and inline keyboard
  bot.start(async (ctx) => {
    await ctx.reply(
      'Use the buttons below to get started.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔭 Fetch Proxies', 'fetch_proxies')],
        [Markup.button.callback('📦 Start Monitoring', 'start_monitor')],
        [Markup.button.callback('📅 Calendar', 'calendar')],
        [Markup.button.callback('💳 Add Card', 'add_card')],
        [Markup.button.callback('📂 Upload Accounts', 'upload_accounts')],
        [Markup.button.callback('📊 My Tier', 'view_tier')]
      ])
    );
  });
};
