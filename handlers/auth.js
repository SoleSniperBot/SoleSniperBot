const { Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const {
  addUserProxies,
  getUserProxies,
  releaseLockedProxy
} = require('../lib/proxyManager');

const proxyFile = path.join(__dirname, '../data/proxies.json');

async function fetchProxies() {
  try {
    const res = await axios.get('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=5000&country=GB&ssl=all&anonymity=elite');
    return res.data.trim().split('\n').filter(Boolean).slice(0, 100);
  } catch (err) {
    console.error('Proxy fetch failed:', err.message);
    return [];
  }
}

module.exports = (bot) => {
  bot.start(async (ctx) => {
    await ctx.reply(
      'Use the buttons below to get started.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔭 Fetch Proxies', 'FETCH_PROXIES')],
        [Markup.button.callback('👀 View Proxies', 'VIEW_PROXIES')],
        [Markup.button.callback('📦 Start Monitoring', 'start_monitor')],
        [Markup.button.callback('📅 Calendar', 'calendar')],
        [Markup.button.callback('💳 Add Card', 'add_card')],
        [Markup.button.callback('📂 Upload Accounts', 'upload_accounts')],
        [Markup.button.callback('📊 My Tier', 'view_tier')],
        [Markup.button.callback('❓ FAQ / Help', 'faq')]
      ])
    );
  });

  bot.action('FETCH_PROXIES', async (ctx) => {
    await ctx.answerCbQuery();
    const proxies = await fetchProxies();
    if (proxies.length > 0) {
      fs.writeFileSync(proxyFile, JSON.stringify(proxies, null, 2));
      addUserProxies(ctx.from.id, proxies.slice(0, 25));
      ctx.reply(`✅ ${proxies.length} UK SOCKS5 proxies fetched and 25 assigned to you.`);
    } else {
      ctx.reply('❌ Failed to fetch proxies.');
    }
  });

  bot.action('VIEW_PROXIES', async (ctx) => {
    await ctx.answerCbQuery();
    const proxies = getUserProxies(ctx.from.id);
    if (proxies.length === 0) {
      return ctx.reply('❌ No proxies assigned. Tap "Fetch Proxies" first.');
    }

    const formatted = proxies.join('\n');
    ctx.reply(`🔐 Your Proxies:\n\`\`\`\n${formatted}\n\`\`\``, {
      parse_mode: 'Markdown'
    });
  });

  bot.command('viewproxies', (ctx) => {
    const proxies = getUserProxies(ctx.from.id);
    if (!proxies.length) {
      return ctx.reply('❌ No proxies assigned to you. Tap "Fetch Proxies" first.');
    }

    ctx.reply(`🔐 Your Assigned Proxies:\n\`\`\`\n${proxies.join('\n')}\n\`\`\``, {
      parse_mode: 'Markdown'
    });
  });

  bot.command('resetproxies', (ctx) => {
    const userId = ctx.from.id;
    const proxies = getUserProxies(userId);
    if (proxies.length) {
      proxies.forEach(p => releaseLockedProxy(p));
      ctx.reply('🔁 Your proxies have been released. You can fetch new ones now.');
    } else {
      ctx.reply('⚠️ You have no proxies to reset.');
    }
  });

  bot.action('faq', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply(
      `❓ *FAQ & Support*\n\nNeed help? DM: [@badmandee1](https://t.me/badmandee1)`,
      { parse_mode: 'Markdown' }
    );
  });
};
