require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// 📂 Load all handlers from /handlers
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  const handler = require(path.join(handlersPath, file));
  if (typeof handler === 'function') {
    console.log(`🔁 Loading handler: ${file}`);
    handler(bot);
  } else {
    console.log(`⚠️ Skipping non-function export: ${file}`);
  }
});

// 🚀 Express Setup (for Railway keep-alive)
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('👟 SoleSniperBot is running.'));
app.listen(PORT, () => {
  console.log(`🌐 Express server running on port ${PORT}`);
});

// ▶️ Start the bot
bot.launch().then(() => {
  console.log('✅ SoleSniperBot launched successfully.');
});

// 🛑 Graceful Shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
