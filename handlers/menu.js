const { Markup } = require('telegraf');
const proxyManager = require('../lib/proxyManager');
const fetchGeoProxies = require('../lib/fetchGeoProxies');
const fs = require('fs');
const path = require('path');

const proxyUploadUsers = new Set();

const accountsPath = path.join(__dirname, '../data/accounts.json');

const mainMenuButtons = Markup.inlineKeyboard([
  [Markup.button.callback('🌐 Fetch GeoNode Proxies', 'fetch_proxies')],      
  [Markup.button.callback('📡 Send Proxies', 'sendproxies')],                 
  [Markup.button.callback('🔄 Rotate Proxy', 'rotateproxy')],                 
  [Markup.button.callback('🧬 Generate Nike Accounts', 'bulkgen')],           
  [Markup.button.callback('📬 View My Accounts', 'myaccounts')],              
  [Markup.button.callback('🛒 JD Auto Checkout', 'jdcheckout')]               
]);

module.exports = (bot) => {
  bot.command('start', async (ctx) => {
    const name = ctx.from.first_name || 'sniper';
    await ctx.reply(
      `👋 Welcome, ${name}!\n\nUse the buttons below to interact with SoleSniperBot.`,
      mainMenuButtons
    );
  });

  bot.command('menu', async (ctx) => {
    await ctx.reply(
      '🔘 Main Menu - choose an option below:',
      mainMenuButtons
    );
  });

  bot.action('bulkgen', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🧬 Enter how many Nike accounts to generate:\n\nFormat: `/bulkgen 10`', {
      parse_mode: 'Markdown'
    });
  });

  bot.action('myaccounts', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📂 To view your generated accounts, type:\n`/myaccounts`', {
      parse_mode: 'Markdown'
    });
  });

  // NEW: /myaccounts command implementation
  bot.command('myaccounts', (ctx) => {
    const userId = String(ctx.from.id);

    if (!fs.existsSync(accountsPath)) {
      return ctx.reply('⚠️ No accounts found yet.');
    }

    const allAccounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    // Filter accounts by userId (assuming accounts have a 'userId' field; if not, you'll need to adapt)
    // If accounts.json stores all accounts globally without user ID, this needs updating.
    const userAccounts = allAccounts.filter(acc => acc.userId === userId);

    if (!userAccounts || userAccounts.length === 0) {
      return ctx.reply('📂 You have no generated accounts yet.');
    }

    let replyText = '📂 *Your Generated Nike Accounts:*\n\n';
    userAccounts.forEach((acc, i) => {
      replyText += `#${i + 1}\nEmail: \`${acc.email}\`\nPassword: \`${acc.password}\`\nProxy: \`${acc.proxy}\`\n\n`;
    });

    ctx.reply(replyText, { parse_mode: 'Markdown' });
  });

  bot.action('sendproxies', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      '📤 Send your residential proxies in this format:\n`ip:port:user:pass`\n\nPaste them directly as a plain message.'
    );
    proxyUploadUsers.add(ctx.from.id);
  });

  bot.on('text', async (ctx) => {
    if (!proxyUploadUsers.has(ctx.from.id)) return;

    const proxies = ctx.message.text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.split(':').length >= 2);

    if (proxies.length === 0) {
      await ctx.reply('⚠️ No valid proxies found in your message.');
      return;
    }

    proxyManager.addUserProxies(ctx.from.id, proxies);
    await ctx.reply(`✅ Added ${proxies.length} proxies to your pool.`);
    proxyUploadUsers.delete(ctx.from.id);
  });

  bot.action('rotateproxy', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🔄 Proxy rotation is handled automatically per session.\nManual control coming soon.');
  });

  bot.action('jdcheckout', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🛒 Send the SKU for JD Sports UK checkout.\n\nFormat: `/jdcheckout SKU123456`');
  });

  bot.action('fetch_proxies', async (ctx) => {
    ctx.answerCbQuery();
    try {
      const proxies = await fetchGeoProxies();
      await ctx.reply(`🌐 Saved ${proxies.length} fresh GeoNode proxies.`);
    } catch (err) {
      console.error('❌ Geo fetch error:', err.message);
      await ctx.reply('❌ Failed to fetch proxies.');
    }
  });
};
