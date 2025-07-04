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

    const proxy = getLockedProxy(userId);
    if (!proxy) return ctx.reply('❌ No available proxies. Please fetch or upload proxies.');

    ctx.reply(`🔐 Logging in with proxy: \`${proxy}\``, { parse_mode: 'Markdown' });

    try {
      const imapConfig = getUserImapConfig(userId);
      if (!imapConfig) {
        releaseLockedProxy(userId);
        return ctx.reply('⚠️ Please set up IMAP first using `/imap` and `/saveimap`.');
      }

      // Simulate Nike login with trigger that causes 2FA
      await axios.post('https://api.nike.com/login', {
        email,
        password: 'dummy-password'
      }, {
        proxy: formatProxy(proxy),
        timeout: 10000
      });

      // Fetch code via IMAP
      const code = await fetchNike2FACode(imapConfig, email);
      if (!code) {
        releaseLockedProxy(userId);
        return ctx.reply('❌ Could not retrieve Nike verification code from your email.');
      }

      // Retry login with 2FA code
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
      releaseLockedProxy(userId);
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
  const pathFile = path.join(__dirname, '../data/working_accounts.json');
  const data = fs.existsSync(pathFile) ? JSON.parse(fs.readFileSync(pathFile)) : {};
  if (!data[userId]) data[userId] = [];
  data[userId].push(`${email} ${status}`);
  fs.writeFileSync(pathFile, JSON.stringify(data, null, 2));
}
