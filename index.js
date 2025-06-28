require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Import core logic
const generateNikeAccount = require('./generateNikeAccount');
const { webhookHandler, initWebhook } = require('./handlers/webhook');
const { buildSkuMap } = require('./lib/skuNames');
const rotateInline = require('./handlers/rotateInline');
rotateInline(bot);

// Refresh SKU → Name map every 10 min
buildSkuMap();
setInterval(buildSkuMap, 1000 * 60 * 10);

// Debug all updates
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// Load all handlers (except webhook.js)
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (file.endsWith('.js') && file !== 'webhook.js') {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') {
      handler(bot);
    }
  }
});

// Add example /bulkgen command for testing
bot.command('bulkgen', async (ctx) => {
  try {
    const account = await generateNikeAccount();
    await ctx.reply(`Generated Nike account:\nEmail: ${account.email}\nPassword: ${account.password}`);
  } catch (err) {
    await ctx.reply('❌ Failed to generate account: ' + err.message);
  }
});

// Start the bot
bot.launch().then(() => {
  console.log('✅ SoleSniperBot is running...');
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Export for webhook
module.exports = {
  bot,
  webhookHandler,
  initWebhook,
};
