const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const axios = require('axios');

module.exports = (bot) => {
  bot.command('login', async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const email = args[1];

    if (!email) {
      return ctx.reply('❗ Usage: /login yourNikeEmail@example.com');
    }

    const proxy = getLockedProxy(userId);
    if (!proxy) {
      return ctx.reply('❌ No available UK residential proxies. Please upload more.');
    }

    ctx.reply(`🔐 Locked proxy for ${email}: \`${proxy}\``, { parse_mode: 'Markdown' });

    try {
      // Parse proxy (expecting format ip:port:user:pass or ip:port)
      const [ip, port, user, pass] = proxy.split(':');
      const proxyConfig = {
        host: ip,
        port: parseInt(port),
        protocol: 'http'
      };

      if (user && pass) {
        proxyConfig.auth = { username: user, password: pass };
      }

      // Simulated login request
      const res = await axios.post('https://api.nike.com/login', {
        email: email,
        password: 'dummy-password' // Replace with real password handling if any
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
      releaseLockedProxy(userId);
    }
  });
};
