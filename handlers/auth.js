const { Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const userProxiesMap = {};      // Maps user ID to assigned proxies
const lockedProxies = new Set(); // Tracks all assigned proxies

// === Fetch proxies from provider and save to proxies.json ===
async function fetchAndSaveProxies() {
  try {
    const response = await axios.get('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=5000&country=GB&ssl=all&anonymity=elite');
    const proxies = response.data.trim().split('\n').filter(Boolean);
    const selected = proxies.slice(0, 100);

    const filePath = path.join(__dirname, '../data/proxies.json');
    fs.writeFileSync(filePath, JSON.stringify(selected, null, 2));

    return selected;
  } catch (err) {
    console.error('Proxy fetch failed:', err.message);
    return null;
  }
}

// === Assign 25 random unused proxies to a user ===
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

// === Get assigned proxies for user ===
function getUserProxies(userId) {
  return userProxiesMap[userId] || [];
}

// === Clear proxies for user ===
function resetUserProxies(userId) {
  const assigned = userProxiesMap[userId];
  if (assigned) {
    assigned.forEach(p => lockedProxies.delete(p));
    delete userProxiesMap[userId];
    return true;
  }
  return false;
}

module.exports = (bot) => {
  // === Inline Button UI on /start ===
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

  // === Inline: Fetch Proxies ===
  bot.action('FETCH_PROXIES', async (ctx) => {
    await ctx.answerCbQuery();
    const fetched = await fetchAndSaveProxies();

    if (fetched && fetched.length > 0) {
      ctx.reply(`✅ ${fetched.length} UK SOCKS5 proxies fetched and saved.`);
    } else {
      ctx.reply('❌ Failed to fetch proxies.');
    }
  });

  // === Inline: View Proxies ===
  bot.action('VIEW_PROXIES', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    let proxies = getUserProxies(userId);

    if (proxies.length === 0) {
      proxies = assignProxiesToUser(userId, 25);
      if (proxies.length === 0) {
        return ctx.reply('❌ Not enough unused proxies. Try tapping "Fetch Proxies" first.');
      }
    }

    const display = proxies.join('\n');
    ctx.reply(`🔐 Your 25 Assigned UK SOCKS5 Proxies:\n\`\`\`\n${display}\n\`\`\``, {
      parse_mode: 'Markdown'
    });
  });

  // === Command: /viewproxies ===
  bot.command('viewproxies', (ctx) => {
    const userId = ctx.from.id;
    const proxies = getUserProxies(userId);

    if (!proxies.length) {
      return ctx.reply('❌ No proxies assigned to you yet. Tap "Fetch Proxies" first.');
    }

    const display = proxies.join('\n');
    ctx.reply(`🔐 Your Assigned Proxies:\n\`\`\`\n${display}\n\`\`\``, {
      parse_mode: 'Markdown'
    });
  });

  // === Command: /resetproxies ===
  bot.command('resetproxies', (ctx) => {
    const userId = ctx.from.id;
    const success = resetUserProxies(userId);

    if (success) {
      ctx.reply('🔁 Your proxies have been released. You can fetch new ones now.');
    } else {
      ctx.reply('⚠️ You have no proxies to reset.');
    }
  });

  // === Inline: FAQ ===
  bot.action('faq', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply(
      `❓ *FAQ & Support*\n\nNeed help? DM: [@badmandee1](https://t.me/badmandee1)`,
      { parse_mode: 'Markdown' }
    );
  });
};
