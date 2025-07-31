require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

// ✅ Confirm TLS client is included
const tlsPath = path.join(__dirname, 'bin', 'tls-client');
if (fs.existsSync(tlsPath)) {
  console.log('✅ TLS client is present at runtime');
  execFile(tlsPath, ['--version'], (err, stdout, stderr) => {
    if (err) {
      console.error('❌ TLS client failed to run:', err.message);
    } else {
      console.log('✅ TLS client output:', stdout);
    }
  });
} else {
  console.error('❌ TLS client is MISSING at runtime!');
}

// ✅ Launch Telegram bot
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// ✅ Load all handlers
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (file.endsWith('.js')) {
    require(path.join(handlersPath, file))(bot);
  }
});

// ✅ Load lib-level Nike task logic at runtime
const tasksPath = path.join(__dirname, 'lib');
fs.readdirSync(tasksPath).forEach((file) => {
  if (file.endsWith('.js') && file.toLowerCase().includes('nike')) {
    require(path.join(tasksPath, file));
  }
});

// ✅ Load auto-monitor logic if needed
try {
  require('./handlers/autoScanner')(bot);
} catch (e) {
  console.warn('⚠️ autoScanner not loaded:', e.message);
}

// ✅ Start the bot
bot.launch().then(() => {
  console.log('✅ SoleSniperBot is running...');
});

// 🛑 Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
