const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Markup } = require('telegraf');
const vipUsers = require('../data/vip.json');

module.exports = (bot) => {
  // 🛰️ Fetch UK SOCKS5 proxies
  bot.command('refreshproxies', async (ctx) => {
    ctx.reply('🔍 Scraping fresh UK SOCKS5 proxies for Nike SNKRS...');

    try {
      const response = await axios.get('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=5000&country=GB&ssl=all&anonymity=elite');
      const proxies = response.data.trim().split('\n').filter(Boolean);
      const selected = proxies.slice(0, 50);

      const filePath = path.join(__dirname, '../data/proxies.json');
      fs.writeFileSync(filePath, JSON.stringify(selected, null, 2));

      ctx.reply(`✅ ${selected.length} UK SOCKS5 proxies saved to proxies.json`);
    } catch (error) {
      console.error(error);
      ctx.reply('❌ Failed to fetch proxies.');
    }
  });

  // 📦 View Proxies (Inline Button)
  bot.action('VIEW_PROXIES', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = String(ctx.from.id);
    if (!vipUsers[userId]) {
      return ctx.reply('❌ VIP only. Unlock via /upgrade');
    }

    const filePath = path.join(__dirname, '../data/proxies.json');
    if (!fs.existsSync(filePath)) {
      return ctx.reply('❗ No proxies found. Please press 🔭 *Fetch Proxies* first.', { parse_mode: 'Markdown' });
    }

    const proxies = JSON.parse(fs.readFileSync(filePath));
    if (!proxies.length) {
      return ctx.reply('❗ No proxies found. Please press 🔭 *Fetch Proxies* first.', { parse_mode: 'Markdown' });
    }

    const list = proxies.slice(0, 10).join('\n');
    ctx.reply(`📦 *Top 10 UK Proxies:*\n\n\`\`\`\n${list}\n\`\`\``, { parse_mode: 'Markdown' });
  });

  // 🔍 /viewproxies command
  bot.command('viewproxies', (ctx) => {
    const userId = String(ctx.from.id);
    if (!vipUsers[userId]) {
      return ctx.reply('❌ VIP only. Use /upgrade');
    }

    const filePath = path.join(__dirname, '../data/proxies.json');
    if (!fs.existsSync(filePath)) {
      return ctx.reply('❗ No proxies found. Please press 🔭 *Fetch Proxies* first.', { parse_mode: 'Markdown' });
    }

    const proxies = JSON.parse(fs.readFileSync(filePath));
    if (!proxies.length) {
      return ctx.reply('❗ No proxies found. Please press 🔭 *Fetch Proxies* first.', { parse_mode: 'Markdown' });
    }

    const list = proxies.slice(0, 10).join('\n');
    ctx.reply(`📦 *Top 10 UK Proxies:*\n\n\`\`\`\n${list}\n\`\`\``, { parse_mode: 'Markdown' });
  });
};
