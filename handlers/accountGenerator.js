// handlers/accountGenerator.js
const fs = require('fs');
const path = require('path');
const { createNikeAccount } = require('../lib/nikeApi'); // ✅ uses lib path
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const accountsPath = path.join(__dirname, '../data/accounts.json');

if (!fs.existsSync(accountsPath)) {
  fs.writeFileSync(accountsPath, JSON.stringify([]));
}

module.exports = (bot) => {
  bot.command('accountgen', async (ctx) => {
    const userId = ctx.from.id;
    ctx.reply('⚙️ Starting Nike account generation...');

    const proxy = await getLockedProxy(userId);
    if (!proxy) {
      return ctx.reply('❌ No proxies available. Upload them first using /proxy.');
    }

    const email = `sniper${Date.now()}@gmail.com`;
    const password = 'SniperBot2025!'; // Replace with secure pass

    try {
      console.log(`🌐 Proxy connected: ${proxy}`);
      const account = await createNikeAccount(email, password, proxy);

      if (account && account.status === 'success') {
        console.log('✅ Account created:', email);

        const accounts = JSON.parse(fs.readFileSync(accountsPath));
        accounts.push({ email, password, createdAt: new Date().toISOString() });
        fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));

        await ctx.reply(`✅ Nike account created:\n📧 ${email}\n🔐 ${password}`);
      } else {
        console.log('❌ Account creation failed:', email);
        await ctx.reply('❌ Account creation failed. Proxy or email may be flagged.');
      }
    } catch (err) {
      console.error('❌ Error during account creation:', err.message);
      await ctx.reply('❌ Unexpected error during generation. Check logs.');
    } finally {
      releaseLockedProxy(userId);
    }
  });
};
