const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const axios = require('axios');

module.exports = (bot) => {
  bot.command('login', async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const email = args[1];
    if (!email) return ctx.reply('❗ Usage: /login yourNikeEmail@example.com');

    const proxy = getLockedProxy(userId);
    if (!proxy) return ctx.reply('❌ No available proxies. Please fetch or upload proxies.');

    ctx.reply(`🔐 Locked proxy for login: \`${proxy}\``, { parse_mode: 'Markdown' });

    try {
      const [ip, port, user, pass] = proxy.split(':');
      const proxyConfig = {
        host: ip,
        port: parseInt(port),
        auth: user && pass ? { username: user, password: pass } : undefined,
        protocol: 'http'
      };

      // Replace with actual Nike login API & logic
      const res = await axios.post('https://api.nike.com/login', {
        email,
        password: 'dummy-password' // replace with your logic to handle password
      }, {
        proxy: proxyConfig,
        timeout: 10000
      });

      if (res.status === 200) {
        ctx.reply(`✅ Login successful for ${email}`);
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
