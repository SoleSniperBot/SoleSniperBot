const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Markup } = require('telegraf');

module.exports = (bot) => {
  bot.command('proxies', (ctx) => {
    return ctx.reply(
      '🧠 Proxy Options:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔭 Fetch Proxies', 'REFRESH_PROXIES')],
        [Markup.button.callback('📄 View Proxies', 'VIEW_PROXIES')]
      ])
    );
  });

  bot.action('REFRESH_PROXIES', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🔍 Fetching UK SOCKS5 and HTTP proxies (less strict filters)...');

    try {
      const resSocks5 = await axios.get(
        'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=5000&country=GB'
      );
      const resHttp = await axios.get(
        'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=5000&country=GB'
      );

      let proxies = [
        ...resSocks5.data.trim().split('\n').filter(Boolean),
        ...resHttp.data.trim().split('\n').filter(Boolean),
      ];
      proxies = [...new Set(proxies)];

      console.log(`Fetched total proxies: ${proxies.length}`);

      if (proxies.length === 0) {
        return ctx.reply('⚠️ No proxies found from ProxyScrape API.');
      }

      const selected = proxies.slice(0, 100);
      const filePath = path.join(__dirname, '../data/proxies.json');
      fs.writeFileSync(filePath, JSON.stringify(selected, null, 2));

      await ctx.reply(`✅ ${selected.length} UK SOCKS5+HTTP proxies saved (no validation).`);
    } catch (error) {
      console.error('Proxy fetch error:', error);
      await ctx.reply('❌ Failed to fetch proxies.');
    }
  });

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

      const sample = proxies.slice(0, 10).join('\n');
      return ctx.replyWithMarkdown(`📄 *Sample Proxies:*\n\`\`\`\n${sample}\n\`\`\``);
    } catch (err) {
      console.error(err);
      return ctx.reply('⚠️ Error reading proxies file. Try fetching again.');
    }
  });
};
