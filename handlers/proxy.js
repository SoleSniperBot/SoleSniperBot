const fs = require('fs');
const path = require('path');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const { Markup } = require('telegraf');
const {
  lockRandomProxy,
  releaseLockedProxy,
  getLockedProxy,
  addUserProxies
} = require('../proxyManager');

module.exports = (bot) => {
  // 📍 Inline Proxy Menu
  bot.command('proxies', (ctx) => {
    return ctx.reply(
      '🧠 Proxy Options:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔭 Fetch Proxies', 'REFRESH_PROXIES')],
        [Markup.button.callback('📄 View Proxies', 'VIEW_PROXIES')],
        [Markup.button.callback('🔁 Rotate Proxy', 'ROTATE_PROXY')],
        [Markup.button.callback('📤 Upload Proxies', 'UPLOAD_PROXY_INSTRUCTIONS')],
      ])
    );
  });

  // 🔁 Rotate proxy for current user
  bot.action('ROTATE_PROXY', async (ctx) => {
    const userId = ctx.from.id;
    releaseLockedProxy(userId);
    const newProxy = lockRandomProxy(userId);

    if (!newProxy) {
      return ctx.reply('⚠️ No proxies available to rotate into.');
    }

    await ctx.reply(`🔁 New Proxy Locked:\n\`${newProxy}\``, { parse_mode: 'Markdown' });
  });

  // 📤 Upload Proxy Instructions
  bot.action('UPLOAD_PROXY_INSTRUCTIONS', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply('📤 Send your SOCKS5 proxies (one per line).\nFormat:\n`socks5://user:pass@ip:port`', {
      parse_mode: 'Markdown',
    });
  });

  // Text input for uploaded proxies
  bot.on('text', async (ctx) => {
    const message = ctx.message.text.trim();
    if (!message.includes('socks5://')) return;

    const proxyList = message
      .split('\n')
      .map(p => p.trim())
      .filter(p => /^socks5:\/\/.+@.+:\d+$/.test(p));

    if (!proxyList.length) {
      return ctx.reply('❌ No valid proxies found in message.');
    }

    addUserProxies(ctx.from.id, proxyList);
    ctx.reply(`✅ ${proxyList.length} proxies added to your account.`);
  });

  // 🔍 Scrape & test free public proxies
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
      const results = await Promise.allSettled(rawProxies.map(testProxy));

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
