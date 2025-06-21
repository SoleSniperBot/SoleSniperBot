const fs = require('fs');
const path = require('path');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
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
    await ctx.reply('🔍 Scraping + testing fast UK proxies for SNKRS...');

    const fetchProxies = async () => {
      const res1 = await axios.get(
        'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=3000&country=GB'
      );
      const res2 = await axios.get(
        'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=3000&country=GB'
      );
      let proxies = [
        ...res1.data.trim().split('\n'),
        ...res2.data.trim().split('\n')
      ].filter(Boolean);
      return [...new Set(proxies)];
    };

    const testProxy = async (proxy) => {
      try {
        const agent = new HttpsProxyAgent(`http://${proxy}`);
        const start = Date.now();
        const res = await axios.get('https://www.nike.com/gb', {
          httpsAgent: agent,
          timeout: 5000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const latency = Date.now() - start;
        return res.status === 200 && latency < 3000; // ⏱️ Fast Nike response
      } catch {
        return false;
      }
    };

    try {
      const rawProxies = await fetchProxies();
      const testResults = await Promise.allSettled(
        rawProxies.map((proxy) => testProxy(proxy))
      );

      const workingProxies = rawProxies.filter((_, i) =>
        testResults[i].status === 'fulfilled' && testResults[i].value === true
      );

      if (workingProxies.length < 10) {
        return ctx.reply(`❌ Only ${workingProxies.length} usable proxies found. Try again soon.`);
      }

      const selected = workingProxies.slice(0, 50); // Top 50 fast + passed

      const filePath = path.join(__dirname, '../data/proxies.json');
      fs.writeFileSync(filePath, JSON.stringify(selected, null, 2));

      await ctx.reply(`✅ ${selected.length} Nike-tested UK proxies saved for SNKRS checkout.`);
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Proxy scraping or testing failed. Try again later.');
    }
  });

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
