require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);

// 🧠 Debug: Log all incoming updates
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// ✅ Load all handlers from /handlers folder with type check
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (file.endsWith('.js')) {
    const handler = require(path.join(handlersPath, file));
    console.log(`Loading handler: ${file} - type: ${typeof handler}`);
    if (typeof handler === 'function') {
      handler(bot);
    } else {
      console.warn(`⚠️ Handler "${file}" does not export a function and was skipped.`);
    }
  }
});

// ✅ Manual load (for files needing load order control)
const autoScannerHandler = require('./handlers/autoScanner');
if (typeof autoScannerHandler === 'function') {
  autoScannerHandler(bot);
} else {
  console.warn('⚠️ autoScanner handler does not export a function.');
}

// ✅ Register /testimap command inline here (if you want to handle it directly)
const testImapHandler = require('./handlers/testImap');
bot.command('testimap', (ctx) => {
  testImapHandler(ctx);
});

// 🚀 Start the bot
bot.launch().then(() => {
  console.log('✅ SoleSniperBot is running...');
});

// 🛑 Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
