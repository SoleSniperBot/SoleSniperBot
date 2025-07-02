require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Load proxy manager and initialize proxies from disk at startup
const { loadProxies } = require('./lib/proxyManager');
loadProxies();

// Load your fetchGeoProxies function
const fetchGeoProxies = require('./lib/fetchGeoProxies');

// Enable session middleware to store temporary context data (e.g., SKU during checkout)
bot.use(session());

// Log all incoming updates (for debugging)
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// Dynamically load all handler files except webhook.js and menu.js
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (file.endsWith('.js') && file !== 'webhook.js' && file !== 'menu.js') {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') {
      handler(bot);
    }
  }
});

// Load menu.js explicitly for /start command and inline buttons
const menuHandler = require('./handlers/menu');
menuHandler(bot);

// Load webhook exports for Express integration or HTTP server if used
const { webhookHandler, initWebhook } = require('./handlers/webhook');

// Command to reload proxies from disk
bot.command('fetchproxies', async (ctx) => {
  try {
    loadProxies();
    await ctx.reply('✅ Proxies reloaded from disk.');
  } catch (err) {
    await ctx.reply('❌ Failed to reload proxies: ' + err.message);
  }
});

// Command to fetch fresh GeoNode proxies and save them
bot.command('fetchgeoproxies', async (ctx) => {
  await ctx.reply('🌍 Fetching fresh UK SOCKS5 proxies from GeoNode...');
  try {
    const proxies = await fetchGeoProxies();
    if (!proxies || proxies.length === 0) {
      return ctx.reply('❌ No proxies fetched from GeoNode.');
    }
    await ctx.reply(`✅ Fetched and saved ${proxies.length} proxies from GeoNode.`);
  } catch (err) {
    console.error('GeoNode fetch error:', err);
    await ctx.reply(`❌ Failed to fetch proxies: ${err.message}`);
  }
});

// Start bot
bot.launch().then(() => {
  console.log('✅ SoleSniperBot is running with session middleware...');
});

// Graceful shutdown handlers
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = {
  bot,
  webhookHandler,
  initWebhook,
};
