const fs = require('fs');
const path = require('path');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getUserImapConfig, fetchNike2FACode } = require('../lib/imapClient'); // Real IMAP client
const axios = require('axios');

const workingPath = path.join(__dirname, '../data/working_accounts.json');
if (!fs.existsSync(workingPath)) fs.writeFileSync(workingPath, JSON.stringify({}));

module.exports = (bot) => {
  bot.command('login', async (ctx) => {
    const userId = String(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const email = args[1];
    if (!email) return ctx.reply('❗ Usage: /login yourNikeEmail@example.com');

    const proxy = await getLockedProxy(userId);
    if (!proxy || typeof proxy !== 'string' || proxy.includes('undefined')) {
      return ctx.reply('❌ No valid proxy available at the moment.');
    }

    ctx.reply(`🔐 Logging in with proxy: \`${proxy}\``, { parse_mode: 'Markdown' });

    try {
      const imapConfig = getUserImapConfig(userId);
      if (!imapConfig || !imapConfig.email) {
        await releaseLockedProxy(userId);
        return ctx.reply('⚠️ Please set up IMAP first using `/imap` and `/saveimap`.');
      }

      // Step 1: Trigger Nike login (simulate)
      await axios.post('https://api.nike.com/login', {
        email,
        password: 'dummy-password'
      }, {
        proxy: formatProxy(proxy),
        timeout: 10000
      });

      // Step 2: Fetch verification code
      const code = await fetchNike2FACode(imapConfig, email);
      if (!code) {
        console.error(`❌ IMAP code not received for ${email}`);
        await releaseLockedProxy(userId);
        return ctx.reply('❌ Could not retrieve Nike verification code from your email.');
      }

      // Step 3: Complete login with code
      const result = await axios.post('https://api.nike.com/verify', {
        email,
        code
      }, {
        proxy: formatProxy(proxy),
        timeout: 10000
      });

      if (result.status === 200 && result.data?.status === 'active') {
        ctx.reply('✅ Login complete. Account is clean 🧼');
        markAccount(userId, email, '🧼');
      } else {
        ctx.reply('❌ Account might be banned or failed login.');
        markAccount(userId, email, '❌');
      }

    } catch (err) {
      ctx.reply(`⚠️ Login error: ${err.message}`);
    } finally {
      await releaseLockedProxy(userId);
    }
  });
};

function formatProxy(proxy) {
  const [ip, port, user, pass] = proxy.split(':');
  return {
    host: ip,
    port: parseInt(port),
    auth: user && pass ? { username: user, password: pass } : undefined,
    protocol: 'http'
  };
}

function markAccount(userId, email, status) {
  const filePath = path.join(__dirname, '../data/working_accounts.json');
  const data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath)) : {};
  if (!data[userId]) data[userId] = [];
  data[userId].push(`${email} ${status}`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
