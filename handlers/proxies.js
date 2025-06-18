const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = (bot) => {
  bot.command('refreshproxies', async (ctx) => {
    ctx.reply('🔍 Scraping fresh UK SOCKS5 proxies for Nike SNKRS...');

    try {
      const response = await axios.get('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=5000&country=GB&ssl=all&anonymity=elite');
      const proxies = response.data.trim().split('\n').filter(Boolean);

      const selected = proxies.slice(0, 50); // increase from 15 to 50

      const filePath = path.join(__dirname, '../data/proxies.json');
      fs.writeFileSync(filePath, JSON.stringify(selected, null, 2));

      ctx.reply(`✅ ${selected.length} UK SOCKS5 proxies saved to proxies.json`);
    } catch (error) {
      console.error(error);
      ctx.reply('❌ Failed to fetch proxies.');
    }
  });
};
