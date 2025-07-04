const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');

const imapPath = path.join(__dirname, '../data/imap.json');

module.exports = (bot) => {
  bot.command('login', async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const email = args[1];
    if (!email) return ctx.reply('❗ Usage: /login yourNikeEmail@example.com');

    const proxy = getLockedProxy(userId);
    if (!proxy) return ctx.reply('❌ No available proxies. Please upload or fetch them first.');

    let proxyConfig;
    try {
      const [ip, port, user, pass] = proxy.split(':');
      proxyConfig = {
        host: ip,
        port: parseInt(port),
        auth: user && pass ? { username: user, password: pass } : undefined,
        protocol: 'http'
      };
    } catch (err) {
      return ctx.reply('❌ Invalid proxy format. Use ip:port:user:pass');
    }

    let imapData = {};
    if (fs.existsSync(imapPath)) {
      const raw = JSON.parse(fs.readFileSync(imapPath, 'utf8'));
      imapData = raw[userId] || {};
    }

    if (!imapData.email || !imapData.pass || !imapData.imapHost || !imapData.imapPort) {
      releaseLockedProxy(userId);
      return ctx.reply('⚠️ IMAP not set. Use /imap and /saveimap to enable 2FA auto-bypass.');
    }

    try {
      await ctx.reply(`🔐 Logging in as *${email}* using stealth proxy...`, { parse_mode: 'Markdown' });

      // Simulate login request (replace with Nike logic later)
      await new Promise(res => setTimeout(res, 1000));
      await ctx.reply('📨 Nike sent a 2FA code to your email. Fetching via IMAP...');

      const code = await fetchNike2FACode(imapData); // Real listener goes here
      if (!code) throw new Error('2FA code not received.');

      await ctx.reply(`✅ Auto-retrieved code: *${code}*\nLogin completed for *${email}*`, { parse_mode: 'Markdown' });

    } catch (err) {
      console.error('❌ Login error:', err.message);
      await ctx.reply(`❌ Login failed: ${err.message}`);
    } finally {
      releaseLockedProxy(userId);
    }
  });
};

// 🔧 Fake IMAP fetch (replace with real fetch logic)
async function fetchNike2FACode(imapData) {
  await new Promise(res => setTimeout(res, 1500));
  return '123456'; // Replace with actual code pulled from mailbox
}
