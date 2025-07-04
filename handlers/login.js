const fs = require('fs');
const path = require('path');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { fetchNike2FACode } = require('../lib/imapClient'); // real IMAP client
const axios = require('axios');

const imapPath = path.join(__dirname, '../data/imap.json');

module.exports = (bot) => {
  bot.command('login', async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const email = args[1];
    const password = args[2];

    if (!email || !password) {
      return ctx.reply('❗ Usage:\n`/login yourNikeEmail@example.com yourPasswordHere`', { parse_mode: 'Markdown' });
    }

    const proxy = getLockedProxy(userId);
    if (!proxy) return ctx.reply('❌ No proxies available. Please upload proxies first.');

    ctx.reply(`🔐 Using proxy: \`${proxy}\``, { parse_mode: 'Markdown' });

    try {
      // Step 1: Trigger login to send code (fake call for now)
      await axios.post('https://api.nike.com/login/sendcode', { email }, { timeout: 10000 });

      ctx.reply('📨 Waiting for Nike 2FA code via IMAP...');

      // Step 2: Fetch 2FA code from user’s IMAP setup
      const imapData = JSON.parse(fs.readFileSync(imapPath, 'utf8'))[userId];
      if (!imapData) throw new Error('IMAP not set. Use /imap command to configure.');

      const code = await fetchNike2FACode(imapData);
      if (!code) throw new Error('2FA code not received.');

      ctx.reply(`🔓 2FA code received: \`${code}\`\n⏳ Logging in...`, { parse_mode: 'Markdown' });

      // Step 3: Final login with email + password + code (pseudo-call)
      const [ip, port, proxyUser, proxyPass] = proxy.split(':');
      const proxyConfig = {
        host: ip,
        port: parseInt(port),
        auth: proxyUser && proxyPass ? { username: proxyUser, password: proxyPass } : undefined,
        protocol: 'http'
      };

      const loginRes = await axios.post('https://api.nike.com/login/finalize', {
        email,
        password,
        code
      }, {
        proxy: proxyConfig,
        timeout: 10000
      });

      if (loginRes.status === 200 && loginRes.data.success) {
        ctx.reply(`🧼 Clean login for: \`${email}\``, { parse_mode: 'Markdown' });
      } else {
        ctx.reply(`❌ Login failed or account banned for: \`${email}\``, { parse_mode: 'Markdown' });
      }

    } catch (err) {
      ctx.reply(`❌ Error: ${err.message}`);
    } finally {
      releaseLockedProxy(userId);
    }
  });
};
