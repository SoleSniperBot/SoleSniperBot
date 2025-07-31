require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Telegraf } = require('telegraf');
const express = require('express');
const https = require('follow-redirects').https;

const bot = new Telegraf(process.env.BOT_TOKEN);

// === TLS CLIENT SETUP ===
const tlsPath = '/tmp/tls-client';
const tlsBinaryUrl = 'https://github.com/SoleSniperBot/SoleSniperBot/releases/download/v1.0.0-linux/tls-client-api-linux-amd64-1.11.0';

function downloadTLSClient(callback) {
  if (fs.existsSync(tlsPath)) {
    console.log('📦 TLS client already exists.');
    return callback();
  }

  console.log('📦 Downloading TLS client...');
  const file = fs.createWriteStream(tlsPath);

  https.get(tlsBinaryUrl, (res) => {
    if (res.statusCode !== 200) {
      console.error(`❌ Download failed. Code: ${res.statusCode}`);
      return;
    }

    res.pipe(file);
    file.on('finish', () => {
      file.close(() => {
        fs.chmodSync(tlsPath, 0o755);
        console.log('✅ TLS client downloaded & ready.');
        callback();
      });
    });
  }).on('error', (err) => {
    console.error('❌ TLS download error:', err.message);
  });
}

// === LOAD HANDLERS ===
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (file.endsWith('.js')) {
    require(path.join(handlersPath, file))(bot);
    console.log(`🔁 Loading handler: ${file}`);
  }
});

// === START EXPRESS SERVER ===
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_, res) => res.send('SoleSniperBot running!'));
app.listen(8080, () => console.log('🌐 Express server running on port 8080'));

// === START BOT AFTER TLS SETUP ===
downloadTLSClient(() => {
  bot.launch().then(() => console.log('🤖 Telegram bot launched successfully.'));
});

// === Graceful shutdown ===
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
