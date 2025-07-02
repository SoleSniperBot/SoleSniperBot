require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Load proxy manager and initialize proxies from disk at startup
const { loadProxies } = require('./lib/proxyManager');
loadProxies();

// Enable session middleware to store temporary context data (like SKU during checkout)
bot.use(session());

// Log all incoming updates (for debugging)
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// Load all handlers except webhook.js and menu.js
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (file.endsWith('.js') && file !== 'webhook.js' && file !== 'menu.js') {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') {
      handler(bot);
    }
  }
});

// Load menu.js explicitly for /start and inline buttons
const menuHandler = require('./handlers/menu');
menuHandler(bot);

// Load webhook exports for express server integration if used
const { webhookHandler, initWebhook } = require('./handlers/webhook');

bot.command('fetchproxies', async (ctx) => {
  try {
    loadProxies();
    await ctx.reply('✅ Proxies reloaded from disk.');
  } catch (err) {
    await ctx.reply('❌ Failed to reload proxies: ' + err.message);
  }
});

// Start bot
bot.launch().then(() => {
  console.log('✅ SoleSniperBot is running with session middleware...');
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = {
  bot,
  webhookHandler,
  initWebhook,
};
