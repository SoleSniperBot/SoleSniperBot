const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Markup } = require('telegraf');
const HttpsProxyAgent = require('https-proxy-agent'); // npm i https-proxy-agent

// Helper to test proxy by making a GET request to Nike SNKRS URL via proxy
async function testProxy(proxy) {
  // proxy format: "ip:port"
  const proxyUrl = `http://${proxy}`; // or socks5:// if SOCKS5
  const agent = new HttpsProxyAgent(proxyUrl);

  try {
    const response = await axios.get('https://www.nike.com/launch/', {
      httpsAgent: agent,
      timeout: 4000, // 4 seconds timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36',
      },
    });
    if (response.status === 200) {
      return true;
    }
  } catch (e) {
    // request failed (timeout, connection refused, banned, etc)
  }
  return false;
}

module.exports = (bot) => {
  bot.command('proxies', (ctx) => {
    return ctx.reply(
      '🧠 Proxy Options:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔭 Fetch Proxies', 'REFRESH_PROXIES')],
        [Markup.button.callback('📄 View Proxies', 'VIEW_PROXIES')],
      ])
    );
  });

  bot.action('REFRESH_PROXIES', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🔍 Scraping and validating UK proxies for Nike SNKRS (this can take a minute)...');

    try {
      // Fetch proxies from ProxyScrape, loosened filter for more results
      const resSocks5 = await axios.get(
        'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=5000&country=GB&anonymity=elite'
      );
      const resHttp = await axios.get(
        'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=5000&country=GB&anonymity=elite'
      );

      // Combine and dedupe
      let proxies = [
        ...resSocks5.data.trim().split('\n').filter(Boolean),
        ...resHttp.data.trim().split('\n').filter(Boolean),
      ];
      proxies = [...new Set(proxies)];

      if (proxies.length === 0) {
        return ctx.reply('⚠️ No proxies found on ProxyScrape API.');
      }

      // Validate proxies - test only first 50 to limit time
      const maxToTest = 50;
      const proxiesToTest = proxies.slice(0, maxToTest);
      const workingProxies = [];

      await ctx.reply(`🔎 Testing ${proxiesToTest.length} proxies, please wait...`);

      for (const proxy of proxiesToTest) {
        const isWorking = await testProxy(proxy);
        if (isWorking) {
          workingProxies.push(proxy);
          // Early break if enough working proxies found (e.g. 20)
          if (workingProxies.length >= 20) break;
        }
      }

      if (workingProxies.length === 0) {
        return ctx.reply('⚠️ No working proxies detected. Try again later or try paid residential proxies.');
      }

      // Save working proxies to file
      const filePath = path.join(__dirname, '../data/proxies.json');
      fs.writeFileSync(filePath, JSON.stringify(workingProxies, null, 2));

      await ctx.reply(`✅ Saved ${workingProxies.length} working UK proxies for Nike SNKRS.`);
    } catch (error) {
      console.error(error);
      await ctx.reply('❌ Failed to fetch or validate proxies.');
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
