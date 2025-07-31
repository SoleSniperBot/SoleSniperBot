require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Telegraf } = require('telegraf');
const generateNikeAccount = require('./lib/generateNikeAccount'); // ✅ Correct path

console.log('🚀 SoleSniperBot backend starting...');

// ✅ Auto-generate 1 Nike account on boot
(async () => {
  try {
    console.log('👟 Auto-generating 1 Nike account...');
    await generateNikeAccount('startup');
    console.log('✅ Account generation done');
  } catch (err) {
    console.error('❌ Error in auto Nike gen:', err.message);
  }
})();

// ✅ Optional: Start Telegram bot
const botToken = process.env.BOT_TOKEN;
if (botToken) {
  const bot = new Telegraf(botToken);
  const handlersPath = path.join(__dirname, 'handlers');
  fs.readdirSync(handlersPath).forEach((file) => {
    if (file.endsWith('.js')) {
      require(path.join(handlersPath, file))(bot);
    }
  });
  bot.launch().then(() => console.log('🤖 Telegram bot live'));
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
  console.warn('⚠️ No BOT_TOKEN set — Telegram bot not started');
}

// ✅ Express server (for Railway, Stripe, uptime)
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('SoleSniperBot is up ✅');
});

app.listen(8080, () => {
  console.log('🌐 Listening on port 8080');
});
