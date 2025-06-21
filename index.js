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

// ✅ Load all handlers from /handlers folder
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (file.endsWith('.js')) {
    require(path.join(handlersPath, file))(bot);
  }
});

// ✅ Manual load (for files needing load order control)
require('./handlers/autoScanner')(bot); // auto-monitor SNKRS drops

// 🚀 Start the bot
bot.launch().then(() => {
  console.log('✅ SoleSniperBot is running...');
});

// 🛑 Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
