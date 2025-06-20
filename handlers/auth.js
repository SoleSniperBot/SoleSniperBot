const { Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const userProxiesMap = {}; // { userId: [proxy1, proxy2, ...] }
const lockedProxies = new Set();

// === Function: Fetch fresh proxies and store them ===
async function fetchAndSaveProxies() {
  try {
    const response = await axios.get('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=5000&country=GB&ssl=all&anonymity=elite');
    const proxies = response.data.trim().split('\n').filter(Boolean);
    const selected = proxies.slice(0, 100); // Save 100 for rotation

    const filePath = path.join(__dirname, '../data/proxies.json');
    fs.writeFileSync(filePath, JSON.stringify(selected, null, 2));

    return selected;
  } catch (err) {
    console.error('Proxy fetch failed:', err.message);
    return null;
  }
}

// === Function: Assign 25 proxies to user ===
function assignProxiesToUser(userId, count = 25) {
  const filePath = path.join(__dirname, '../data/proxies.json');
  if (!fs.existsSync(filePath)) return [];

  const allProxies = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const available = allProxies.filter(p => !lockedProxies.has(p));

  if (available.length < count) return [];

  const selected = [];
  while (selected.length < count) {
    const rand = available[Math.floor(Math.random() * available.length)];
    if (!selected.includes(rand)) {
      selected.push(rand);
      lockedProxies.add(rand);
    }
  }

  userProxiesMap[userId] = selected;
  return selected;
}

// === Function: Return user proxies if already assigned ===
function getUserProxies(userId) {
  return userProxiesMap[userId] || [];
}

module.exports = (bot) => {
  // === START ===
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

  // === ACTION: FETCH_PROXIES ===
  bot.action('FETCH_PROXIES', async (ctx) => {
    await ctx.answerCbQuery();
    const fetched = await fetchAndSaveProxies();

    if (fetched && fetched.length > 0) {
      ctx.reply(`✅ ${fetched.length} UK SOCKS5 proxies fetched and ready.`);
    } else {
      ctx.reply('❌ Failed to fetch proxies.');
    }
  });

  // === ACTION: VIEW_PROXIES ===
  bot.action('VIEW_PROXIES', async (ctx) => {
    await ctx.answerCbQuery();

    const userId = ctx.from.id;
    let userProxies = getUserProxies(userId);

    if (userProxies.length === 0) {
      userProxies = assignProxiesToUser(userId, 25);

      if (userProxies.length === 0) {
        return ctx.reply('❌ Not enough unused proxies. Try "Fetch Proxies" first.');
      }
    }

    const display = userProxies.join('\n');
    ctx.reply(`🔐 Your 25 Assigned UK SOCKS5 Proxies:\n\`\`\`\n${display}\n\`\`\``, {
      parse_mode: 'Markdown'
    });
  });

  // === ACTION: FAQ ===
  bot.action('faq', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply(
      `❓ *FAQ & Support*\n\nHaving trouble?\nContact support: [@badmandee1](https://t.me/badmandee1)`,
      { parse_mode: 'Markdown' }
    );
  });
};
