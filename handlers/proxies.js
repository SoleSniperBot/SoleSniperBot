bot.action('REFRESH_PROXIES', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('🔍 Fetching UK SOCKS5 and HTTP proxies (less strict filters)...');

  try {
    // Fetch SOCKS5 UK proxies without anonymity filter
    const resSocks5 = await axios.get(
      'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=5000&country=GB'
    );

    // Fetch HTTP UK proxies without anonymity filter
    const resHttp = await axios.get(
      'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=5000&country=GB'
    );

    // Combine, split, filter empty lines, dedupe
    let proxies = [
      ...resSocks5.data.trim().split('\n').filter(Boolean),
      ...resHttp.data.trim().split('\n').filter(Boolean),
    ];
    proxies = [...new Set(proxies)];

    console.log(`Fetched total proxies: ${proxies.length}`);

    if (proxies.length === 0) {
      return ctx.reply('⚠️ No proxies found from ProxyScrape API.');
    }

    // Take first 100 proxies to save
    const selected = proxies.slice(0, 100);

    const filePath = path.join(__dirname, '../data/proxies.json');
    fs.writeFileSync(filePath, JSON.stringify(selected, null, 2));

    await ctx.reply(`✅ ${selected.length} UK SOCKS5+HTTP proxies saved (no validation).`);
  } catch (error) {
    console.error('Proxy fetch error:', error);
    await ctx.reply('❌ Failed to fetch proxies.');
  }
});
