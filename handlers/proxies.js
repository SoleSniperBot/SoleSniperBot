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
      ).slice(0, 50); // limit to top 50

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
