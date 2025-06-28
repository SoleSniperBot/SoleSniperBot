require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Import your generateNikeAccount function
const generateNikeAccount = require('./generateNikeAccount');

// Log all incoming updates
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// Load handlers except webhook.js (as explained before)
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (file.endsWith('.js') && file !== 'webhook.js') {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') {
      handler(bot);
    }
  }
});

// Manually load webhook.js exports
const { webhookHandler, initWebhook } = require('./handlers/webhook');

// Simple /bulkgen command to generate 1 Nike account (example)
bot.command('bulkgen', async (ctx) => {
  try {
    // You can parse ctx.message.text to get a number count later
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

module.exports = {
  bot,
  webhookHandler,
  initWebhook,
};
