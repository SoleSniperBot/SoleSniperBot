const fs = require('fs');
const path = require('path');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const { Markup } = require('telegraf');

module.exports = (bot) => {
  // 📍 Inline command UI
  bot.command('proxies', (ctx) => {
    return ctx.reply(
      '🧠 Proxy Options:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔭 Fetch Proxies', 'REFRESH_PROXIES')],
        [Markup.button.callback('📄 View Proxies', 'VIEW_PROXIES')]
      ])
    );
  });

  // ✅ Fast, global, parallel proxy scraping and testing
  bot.action('REFRESH_PROXIES', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🔍 Scraping and testing GLOBAL proxies (fast parallel)...');

    const fetchProxies = async () => {
      const res1 = await axios.get(
        'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=3000&country=all'
      );
      const res2 = await axios.get(
        'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=3000&country=all'
      );
      const all = [...res1.data.trim().split('\n'), ...res2.data.trim().split('\n')];
      return [...new Set(all.filter(p => p.includes(':')))];
    };

    const testProxy = async (proxy) => {
      try {
        const agent = new HttpsProxyAgent(`http://${proxy}`);
        const res = await axios.get('https://api.ipify.org?format=json', {
          httpsAgent: agent,
          timeout: 4000,
        });
        return res.status === 200;
      } catch {
        return false;
      }
    };

    try {
      const rawProxies = await fetchProxies();
      const results = await Promise.allSettled(
        rawProxies.map(p => testProxy(p))
      );

      const working = rawProxies.filter((_, i) =>
        results[i].status === 'fulfilled' && results[i].value === true
      ).slice(0, 50);

      if (!working.length) {
        return ctx.reply('❌ No working proxies found after fast test. Try again.');
      }

      const filePath = path.join(__dirname, '../data/proxies.json');
      fs.writeFileSync(filePath, JSON.stringify(working, null, 2));

      await ctx.reply(`✅ ${working.length} working proxies saved (GLOBAL, fast-tested).`);
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Proxy scraping or testing failed.');
    }
  });

  // 👀 View saved proxies
  bot.action('VIEW_PROXIES', async (ctx) => {
    await ctx.answerCbQuery();
    const filePath = path.join(__dirname, '../data/proxies.json');

    if (!fs.existsSync(filePath)) {
      return ctx.reply('⚠️ No proxies saved yet.');
    }

    const proxies = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!proxies.length) {
      return ctx.reply('⚠️ Proxy list is empty. Try fetching again.');
    }

    const sample = proxies.slice(0, 10).join('\n');
    return ctx.replyWithMarkdown(`📄 *Sample Proxies:*\n\`\`\`\n${sample}\n\`\`\``);
  });
};
