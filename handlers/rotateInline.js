require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const fetchGeoProxies = require('./lib/fetchGeoProxies');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Log incoming updates
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// Load handlers except webhook.js and menu.js
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (file.endsWith('.js') && file !== 'webhook.js' && file !== 'menu.js' && file !== 'rotateinline.js') {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') {
      handler(bot);
    }
  }
});

// Explicitly load menu.js and rotateinline.js to register commands and inline button handlers
const menuHandler = require('./handlers/menu');
menuHandler(bot);

const rotateInline = require('./handlers/rotateinline');
rotateInline(bot);

// Manually load webhook exports
const { webhookHandler, initWebhook } = require('./handlers/webhook');

// /fetchproxies command to fetch GeoNode proxies
bot.command('fetchproxies', async (ctx) => {
  try {
    const proxies = await fetchGeoProxies();
    await ctx.reply(`✅ Fetched ${proxies.length} GeoNode proxies and saved to bot.`);
  } catch (err) {
    console.error('❌ Proxy fetch error:', err.message);
    await ctx.reply('❌ Failed to fetch proxies: ' + err.message);
  }
});

// Start bot
bot.launch().then(() => {
  console.log('✅ SoleSniperBot is running...');
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = {
  bot,
  webhookHandler,
  initWebhook,
};
