const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { fetchNike2FA } = require('../lib/imap'); // ✅ Gmail-only 2FA fetch
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');

const workingPath = path.join(__dirname, '../data/working_accounts.json');
if (!fs.existsSync(workingPath)) fs.writeFileSync(workingPath, JSON.stringify({}));

module.exports = (bot) => {
  bot.command('login', async (ctx) => {
    const userId = String(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const email = args[1];
    const password = args[2];

    if (!email || !password) {
      return ctx.reply('❗ Usage: /login yourNikeEmail@gmail.com yourEmailPassword');
    }

    const proxy = await getLockedProxy(userId);
    if (!proxy || proxy.includes('undefined')) {
      return ctx.reply('❌ No valid proxy available right now.');
    }

    ctx.reply(`🔐 Starting login for *${email}* using proxy:\n\`${proxy}\``, { parse_mode: 'Markdown' });

    try {
      // Step 1: Trigger login (mock attempt)
      await axios.post('https://api.nike.com/login', {
        email,
        password: 'NikeDummy123!'
      }, {
        proxy: formatProxy(proxy),
        timeout: 10000
      });

      // Step 2: Fetch 2FA Code from Gmail
      const code = await fetchNike2FA(email, password, proxy);
      if (!code) throw new Error('Code not found in Gmail inbox');

      // Step 3: Complete Login with 2FA
      const res = await axios.post('https://api.nike.com/verify', {
        email,
        code
      }, {
        proxy: formatProxy(proxy),
        timeout: 10000
      });

      if (res.status === 200 && res.data?.status === 'active') {
        ctx.reply('✅ Login successful. Account is clean 🧼');
        markAccount(userId, email, '🧼');
      } else {
        ctx.reply('❌ Login failed or account is flagged.');
        markAccount(userId, email, '❌');
      }

    } catch (err) {
      ctx.reply(`⚠️ Login error: ${err.message}`);
    } finally {
      await releaseLockedProxy(userId);
    }
  });
};

// === Helpers
function formatProxy(proxy) {
  const [ip, port, user, pass] = proxy.split(':');
  return {
    host: ip,
    port: parseInt(port),
    auth: { username: user, password: pass },
    protocol: 'http'
  };
}

function markAccount(userId, email, status) {
  const file = path.join(__dirname, '../data/working_accounts.json');
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {};
  if (!data[userId]) data[userId] = [];
  data[userId].push(`${email} ${status}`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
