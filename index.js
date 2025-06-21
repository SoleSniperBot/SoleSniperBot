require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);

// 🧠 Log incoming updates for debugging
bot.use((ctx, next) => {
  console.log('📥 Update type:', ctx.updateType);
  return next();
});

// ✅ Load handlers
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  const handler = require(path.join(handlersPath, file));
  handler(bot);
});

// 🚀 Launch the bot
bot.launch().then(() => {
  console.log('✅ SoleSniperBot is live');
});

// 🛑 Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
