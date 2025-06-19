const { Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

const proxyScraper = require('../lib/proxyScraper'); // Assumes your logic is in lib/proxyScraper.js

module.exports = (bot) => {
  bot.action('fetch_proxies', async (ctx) => {
    try {
      await ctx.answerCbQuery(); // Acknowledge button tap
      await ctx.editMessageText('🔄 Scraping fresh SOCKS5 proxies...');
      
      const proxies = await proxyScraper(); // Fetch proxies
      if (!proxies || proxies.length === 0) {
        return ctx.reply('❌ No proxies found. Try again later.');
      }

      // Send first 20 for preview
      const preview = proxies.slice(0, 20).join('\n');

      // Save full proxy list to file
      const filePath = path.join(__dirname, '../data/scraped_proxies.txt');
      fs.writeFileSync(filePath, proxies.join('\n'));

      await ctx.replyWithDocument({
        source: filePath,
        filename: 'scraped_proxies.txt',
      }, {
        caption: '✅ Scraped SOCKS5 proxies. First 20 shown below:\n\n' + preview,
      });

    } catch (err) {
      console.error('Proxy fetch error:', err);
      ctx.reply('⚠️ Failed to fetch proxies. Try again later.');
    }
  });
};
