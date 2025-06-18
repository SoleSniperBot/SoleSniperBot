const { getLockedProxy, releaseProxy } = require('../lib/proxyManager');
const fs = require('fs');
const axios = require('axios'); // Assuming axios is used for login requests

module.exports = (bot) => {
  bot.command('login', async (ctx) => {
    const userId = ctx.from.id;
    const [_, email] = ctx.message.text.split(' ');

    if (!email) return ctx.reply('❗ Usage: /login yourNikeEmail@example.com');

    const proxy = getLockedProxy(userId, email);
    if (!proxy) return ctx.reply('❌ No available UK resi proxies. Please upload more.');

    ctx.reply(`🔐 Locked proxy for ${email}: \`${proxy}\``, { parse_mode: 'Markdown' });

    try {
      // Simulated login logic using the proxy
      const [ip, port, user, pass] = proxy.split(':');
      const proxyConfig = {
        host: ip,
        port: parseInt(port),
        auth: user && pass ? { username: user, password: pass } : undefined,
        protocol: 'http'
      };

      const res = await axios.post('https://api.nike.com/login', {
        email: email,
        password: 'dummy-password'
      }, {
        proxy: proxyConfig,
        timeout: 10000
      });

      if (res.status === 200) {
        ctx.reply(`✅ Login success for ${email}`);
      } else {
        ctx.reply(`⚠️ Login failed for ${email}`);
      }

    } catch (err) {
      ctx.reply(`❌ Login error: ${err.message}`);
    } finally {
      releaseProxy(email); // Free the proxy after session
    }
  });
};
