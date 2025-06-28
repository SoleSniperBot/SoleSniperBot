require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

// Init bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Log all incoming updates
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// Load all handlers (except webhook.js which is handled manually)
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (file.endsWith('.js') && file !== 'webhook.js') {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') {
      handler(bot);
    }
  }
});

// Manually load webhook handler
const { webhookHandler, initWebhook } = require('./handlers/webhook');

// Manually load rotate inline handler
const rotateInline = require('./handlers/rotateInline');
rotateInline(bot);

// ✅ Add any special command here (example: bulkgen)
const generateNikeAccount = require('./generateNikeAccount');
bot.command('bulkgen', async (ctx) => {
  try {
    const account = await generateNikeAccount();
    await ctx.reply(`🧪 Generated Nike Account:\n📧 ${account.email}\n🔑 ${account.password}`);
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

// Export for webhook integration
module.exports = {
  bot,
  webhookHandler,
  initWebhook,
};
