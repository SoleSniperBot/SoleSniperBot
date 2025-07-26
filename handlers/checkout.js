const fs = require('fs');
const path = require('path');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { checkoutSNKRS } = require('../lib/snkrsCheckout'); // TLS spoofed checkout
const { Markup } = require('telegraf');

const accountsPath = path.join(__dirname, '../data/created_accounts.json');
const profilesPath = path.join(__dirname, '../data/profiles.json');

module.exports = (bot) => {
  bot.command('checkout', async (ctx) => {
    const userId = String(ctx.from.id);
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) {
      return ctx.reply('❌ Format:\n`/checkout <SKU> <Size>`\nExample: `/checkout FJ1234-001 10`', { parse_mode: 'Markdown' });
    }

    const [sku, size] = args;

    const allAccounts = JSON.parse(fs.readFileSync(accountsPath));
    const profiles = JSON.parse(fs.readFileSync(profilesPath));
    const userProfiles = profiles[userId];

    const availableAccount = allAccounts.find(acc => acc.user === userId);
    if (!availableAccount) return ctx.reply('⚠️ No Nike accounts found. Generate first.');
    if (!userProfiles || userProfiles.length === 0) return ctx.reply('⚠️ No profile found. Add one with "Add Profile" in /menu.');

    const profile = userProfiles[0]; // Use first profile for now

    ctx.reply(`🛒 Attempting checkout...\nSKU: ${sku}\nSize: ${size}`);

    const proxy = await getLockedProxy();
    if (!proxy) return ctx.reply('❌ No proxies available.');

    try {
      const result = await checkoutSNKRS({
        account: availableAccount,
        profile,
        sku,
        size,
        proxy
      });

      if (result.success) {
        ctx.reply(`✅ Checkout Success!\n📧 ${availableAccount.email}\n👟 ${sku} - Size ${size}`);
      } else {
        ctx.reply(`❌ Checkout Failed:\n${result.message}`);
      }
    } catch (err) {
      console.error('❌ Checkout Error:', err.message);
      ctx.reply(`❌ Unexpected Error:\n${err.message}`);
    } finally {
      await releaseLockedProxy(proxy);
    }
  });
};
