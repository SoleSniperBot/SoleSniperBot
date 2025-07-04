const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const fs = require('fs');
const path = require('path');
const connectWithImap = require('../lib/imapClient');

const imapPath = path.join(__dirname, '../data/imap.json');

module.exports = (bot) => {
  bot.command('login', async (ctx) => {
    const userId = ctx.from.id.toString();
    const args = ctx.message.text.split(' ');
    const email = args[1];
    if (!email) return ctx.reply('❗ Usage: /login yourNikeEmail@example.com');

    const proxy = getLockedProxy(userId);
    if (!proxy) return ctx.reply('❌ No available proxies. Please fetch or upload proxies.');
    ctx.reply(`🔐 Locked proxy for login: \`${proxy}\``, { parse_mode: 'Markdown' });

    // Load user's IMAP config
    if (!fs.existsSync(imapPath)) return ctx.reply('⚠️ No IMAP settings found. Use /imap and /saveimap to configure.');
    const imapData = JSON.parse(fs.readFileSync(imapPath, 'utf8'));
    const userImap = imapData[userId];
    if (!userImap) return ctx.reply('⚠️ You must set up IMAP first using /saveimap.');

    try {
      // Simulate login that triggers Nike 2FA
      await ctx.reply('📩 Logging in... Awaiting 2FA email from Nike.');

      // 🧠 Replace this with actual login request that triggers 2FA code to email inbox
      await new Promise(resolve => setTimeout(resolve, 4000)); // Simulated delay

      const code = await connectWithImap(userImap, email);
      if (!code) {
        await ctx.reply('❌ Could not find any recent 2FA code. Check your inbox and IMAP config.');
      } else {
        await ctx.reply(`✅ Fetched code: \`${code}\` from inbox. Proceeding with login...`, { parse_mode: 'Markdown' });

        // Final step: simulate login with code
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate second request
        await ctx.reply(`🎯 Login complete for: \`${email}\``, { parse_mode: 'Markdown' });
      }
    } catch (err) {
      console.error('Login error:', err.message);
      ctx.reply(`❌ IMAP/Login error: ${err.message}`);
    } finally {
      releaseLockedProxy(userId);
    }
  });
};
