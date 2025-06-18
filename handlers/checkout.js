const { getLockedProxy, releaseProxy } = require('../lib/proxyManager');
const axios = require('axios');

module.exports = (bot) => {
  bot.command('checkout', async (ctx) => {
    const userId = ctx.from.id;
    const [_, email, sku] = ctx.message.text.split(' ');

    if (!email || !sku) {
      return ctx.reply('❗ Usage: /checkout yourNikeEmail@example.com SKU12345');
    }

    const proxy = getLockedProxy(userId, email);
    if (!proxy) return ctx.reply('❌ No available UK resi proxies. Upload more via /uploadproxies.');

    ctx.reply(`🛒 Attempting checkout for *${email}* on SKU *${sku}* with locked proxy: \`${proxy}\``, { parse_mode: 'Markdown' });

    try {
      const [ip, port, user, pass] = proxy.split(':');
      const proxyConfig = {
        host: ip,
        port: parseInt(port),
        auth: user && pass ? { username: user, password: pass } : undefined,
        protocol: 'http'
      };

      // Simulated request
      const res = await axios.post(`https://api.nike.com/checkout/${sku}`, {
        email,
        size: 'UK 9',
        address: '123 Bot Street'
      }, {
        proxy: proxyConfig,
        timeout: 10000
      });

      if (res.status === 200) {
        ctx.reply(`✅ Checkout successful for ${sku} on ${email}`);
      } else {
        ctx.reply(`⚠️ Checkout failed for ${email}`);
      }

    } catch (err) {
      ctx.reply(`❌ Checkout error: ${err.message}`);
    } finally {
      releaseProxy(email);
    }
  });
};
