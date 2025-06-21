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
    await ctx.reply('🔍 Fetching and testing UK proxies (Nike ⏩ IP fallback)...');

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

    const testProxy = async (proxy, testNike = true) => {
      try {
        const agent = new HttpsProxyAgent(`http://${proxy}`);
        const url = testNike ? 'https://www.nike.com/gb' : 'https://api.ipify.org?format=json';
        const res = await axios.get(url, {
          httpsAgent: agent,
          timeout: 5000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        return res.status === 200;
      } catch {
        return false;
      }
    };

    try {
      const rawProxies = await fetchProxies();

      // Step 1: Nike validation
      const testNike = await Promise.allSettled(
        rawProxies.map((proxy) => testProxy(proxy, true))
      );
      const passedNike = rawProxies.filter((_, i) =>
        testNike[i].status === 'fulfilled' && testNike[i].value === true
      );

      if (passedNike.length >= 10) {
        fs.writeFileSync(
          path.join(__dirname, '../data/proxies.json'),
          JSON.stringify(passedNike.slice(0, 50), null, 2)
        );
        return ctx.reply(`✅ ${passedNike.length} Nike-tested UK proxies saved.`);
      }

      // Step 2: Fallback to ipify
      const testIP = await Promise.allSettled(
        rawProxies.map((proxy) => testProxy(proxy, false))
      );
      const passedIP = rawProxies.filter((_, i) =>
        testIP[i].status === 'fulfilled' && testIP[i].value === true
      );

      if (passedIP.length === 0) {
        return ctx.reply('❌ No working proxies found, even with fallback. Try again later.');
      }

      fs.writeFileSync(
        path.join(__dirname, '../data/proxies.json'),
        JSON.stringify(passedIP.slice(0, 50), null, 2)
      );

      return ctx.reply(`⚠️ Only ${passedNike.length} passed Nike test. Using ${passedIP.length} IP-only proxies instead.`);
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Proxy fetch or validation failed.');
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
