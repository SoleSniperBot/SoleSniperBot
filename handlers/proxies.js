const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Markup } = require('telegraf');

module.exports = (bot) => {
  // 💼 Inline keyboard for proxies menu
  bot.command('proxies', (ctx) => {
    return ctx.reply(
      '🧠 Proxy Options:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔭 Fetch Proxies', 'REFRESH_PROXIES')],
        [Markup.button.callback('📄 View Proxies', 'VIEW_PROXIES')]
      ])
    );
  });

  // 🔁 Refresh (Fetch) Proxies
  bot.action('REFRESH_PROXIES', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🔍 Scraping fresh UK SOCKS5 proxies for Nike SNKRS...');

    try {
      const response = await axios.get(
        'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=5000&country=GB&ssl=all&anonymity=elite'
      );
      const proxies = response.data.trim().split('\n').filter(Boolean);
      const selected = proxies.slice(0, 50);

      const filePath = path.join(__dirname, '../data/proxies.json');
      fs.writeFileSync(filePath, JSON.stringify(selected, null, 2));

      await ctx.reply(`✅ ${selected.length} UK SOCKS5 proxies saved.`);
    } catch (error) {
      console.error(error);
      await ctx.reply('❌ Failed to fetch proxies.');
    }
  });

  // 📄 View saved proxies (open to all users now)
  bot.action('VIEW_PROXIES', async (ctx) => {
    await ctx.answerCbQuery();

    const filePath = path.join(__dirname, '../data/proxies.json');
    if (!fs.existsSync(filePath)) {
      return ctx.reply('⚠️ No proxies saved yet. Tap "🔭 Fetch Proxies" first.');
    }

    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const proxies = JSON.parse(data);

      if (!proxies.length) {
        return ctx.reply('⚠️ No proxies found. Tap "🔭 Fetch Proxies" first.');
      }

      const sample = proxies.slice(0, 10).join('\n'); // show first 10 only
      return ctx.replyWithMarkdown(`📄 *Sample Proxies:*\n\`\`\`\n${sample}\n\`\`\``);
    } catch (err) {
      console.error(err);
      return ctx.reply('⚠️ Error reading proxies file. Try fetching again.');
    }
  });
};
