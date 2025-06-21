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
    await ctx.reply('🔍 Scraping GLOBAL proxies (not UK-only)...');

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
      const workingProxies = [];

      for (const proxy of rawProxies) {
        const valid = await testProxy(proxy);
        if (valid) {
          workingProxies.push(proxy);
          if (workingProxies.length >= 10) break;
        }
      }

      if (!workingProxies.length) {
        return ctx.reply('❌ Still no working proxies found. Try again later.');
      }

      fs.writeFileSync(
        path.join(__dirname, '../data/proxies.json'),
        JSON.stringify(workingProxies, null, 2)
      );

      await ctx.reply(`✅ ${workingProxies.length} working GLOBAL proxies saved. You can now use them.`);
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
