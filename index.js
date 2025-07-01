require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const fetchGeoProxies = require('./lib/fetchGeoProxies');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Log incoming updates for debugging
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// Load all handlers except webhook.js and menu.js dynamically
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (file.endsWith('.js') && file !== 'webhook.js' && file !== 'menu.js') {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') {
      handler(bot);
    }
  }
});

// Explicitly load menu.js to register /start and inline buttons
const menuHandler = require('./handlers/menu');
menuHandler(bot);

// Explicitly load new myprofiles handler for /myprofiles command
const myProfilesHandler = require('./handlers/myprofiles');
myProfilesHandler(bot);

// Load webhook exports manually if you use webhook.js
const { webhookHandler, initWebhook } = require('./handlers/webhook');

// /fetchproxies command for GeoNode proxy fetching
bot.command('fetchproxies', async (ctx) => {
  try {
    const proxies = await fetchGeoProxies();
    await ctx.reply(`✅ Fetched and saved ${proxies.length} GeoNode proxies.`);
  } catch (err) {
    console.error('❌ Proxy fetch error:', err.message);
    await ctx.reply(`❌ Failed to fetch proxies: ${err.message}`);
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
