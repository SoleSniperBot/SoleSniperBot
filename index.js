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
  if (
    file.endsWith('.js') &&
    file !== 'webhook.js' &&
    file !== 'menu.js'
  ) {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') {
      handler(bot);
    }
  }
});

// Load menu handler explicitly (contains /start and inline buttons)
const menuHandler = require('./handlers/menu');
menuHandler(bot);

// Load snkrs handler explicitly (optional, but good for command usage)
const snkrsHandler = require('./handlers/snkrs');
snkrsHandler(bot);

// Load webhook exports if any
const { webhookHandler, initWebhook } = require('./handlers/webhook');

// /fetchproxies command (optional extra)
bot.command('fetchproxies', async (ctx) => {
  try {
    const proxies = await fetchGeoProxies();
    await ctx.reply(`✅ Fetched ${proxies.length} GeoNode proxies and saved to bot.`);
  } catch (err) {
    console.error('❌ Proxy fetch error:', err.message);
    await ctx.reply('❌ Failed to fetch proxies: ' + err.message);
  }
});

// Start the bot
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
