const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = (bot) => {
  // Command to refresh and save proxies
  bot.command('refreshproxies', async (ctx) => {
    ctx.reply('🔍 Scraping fresh UK SOCKS5 proxies for Nike SNKRS...');

    try {
      const response = await axios.get('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=5000&country=GB&ssl=all&anonymity=elite');
      const proxies = response.data.trim().split('\n').filter(Boolean);

      const selected = proxies.slice(0, 50); // Save top 50

      const filePath = path.join(__dirname, '../data/proxies.json');
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(selected, null, 2));
      ctx.reply(`✅ ${selected.length} UK SOCKS5 proxies saved to proxies.json`);
    } catch (error) {
      console.error(error);
      ctx.reply('❌ Failed to fetch proxies.');
    }
  });

  // Optional: command to view proxies
  bot.command('viewproxies', (ctx) => {
    const filePath = path.join(__dirname, '../data/proxies.json');
    if (fs.existsSync(filePath)) {
      const proxies = JSON.parse(fs.readFileSync(filePath));
      const display = proxies.slice(0, 10).join('\n');
      ctx.reply(`📦 Top 10 proxies:\n\n${display}`);
    } else {
      ctx.reply('❌ proxies.json not found.');
    }
  });
};
