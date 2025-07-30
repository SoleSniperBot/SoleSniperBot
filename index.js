require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Telegraf, session } = require('telegraf');
const express = require('express');
const bodyParser = require('body-parser');
const { EventEmitter } = require('events');
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
const https = require('https');
const { exec } = require('child_process');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

// 🧠 Telegram update logging
bot.use((ctx, next) => {
  console.log(`📥 Telegram update received: ${ctx.updateType}`);
  return next();
});

// 🔧 Load all handlers except core priority ones
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (
    file.endsWith('.js') &&
    !['webhook.js', 'menu.js', 'rotateinline.js'].includes(file)
  ) {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') {
      console.log(`🔄 Loading handler: ${file}`);
      handler(bot);
    }
  }
});

// ⚙️ Core load order
require('./handlers/menu')(bot);
require('./handlers/myaccounts')(bot);
require('./handlers/rotateinline')(bot);
require('./handlers/cooktracker')(bot);
require('./handlers/viewimap')(bot);

// 🛒 JD Sports handler (inline profile handling)
const { handleJDProfileSelection } = require('./handlers/jdcheckout');
handleJDProfileSelection(bot);

// 💳 Stripe webhook
const { webhookHandler, initWebhook } = require('./handlers/webhook');
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.post('/webhook', webhookHandler, initWebhook(bot));

// 🌐 Health check
app.get('/', (req, res) => {
  console.log('✅ Health check ping received.');
  res.send('✅ SoleSniperBot is live and running.');
});

// 📊 Cooktracker command
const cookTrackerPath = path.join(__dirname, 'data/stats.json');
bot.command('cooktracker', async (ctx) => {
  if (!fs.existsSync(cookTrackerPath)) {
    return ctx.reply('📊 No cook data yet.');
  }

  const stats = JSON.parse(fs.readFileSync(cookTrackerPath));
  const userId = ctx.from.id.toString();
  const cooked = stats[userId] || [];

  if (!cooked.length) {
    return ctx.reply('📊 No successful checkouts recorded for you yet.');
  }

  const msg =
    `🔥 You’ve cooked ${cooked.length} item(s):\n` +
    cooked.map((sku, i) => `#${i + 1}: ${sku}`).join('\n');
  ctx.reply(msg);
});

// 🧪 Global debug emitter
global.botEmitter = new EventEmitter();
global.botEmitter.on('accountgen', (data) => {
  console.log(`🧪 [GEN] ${data}`);
});

// 🚀 Start Express server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`🌐 Express server running on port ${PORT}`);
});

// 🤖 Start Telegram bot
bot.launch().then(() => {
  console.log('🤖 SoleSniperBot Telegram bot is LIVE.');
});

// ✅ SOCKS5 Nike proxy test (GeoNode)
(async () => {
  try {
    const proxy = 'socks5://geonode_fUy6U0SWyY:2e3344b4-40ed-4ab8-9299-fdda9d2188a4@proxy.geonode.io:12000';
    const agent = new SocksProxyAgent(proxy);

    const res = await axios.get('https://api.myip.com', {
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 8000,
    });

    console.log(`✅ SOCKS5 Proxy Test Success: IP ${res.data.ip}, Country ${res.data.country}`);
  } catch (err) {
    console.error('❌ SOCKS5 Proxy Test Failed:', err.message);
  }
})();

// 🔐 TLS Client downloader + executor
const tlsBinaryUrl = 'https://github.com/SoleSniperBot/SoleSniperBot/releases/download/v1.0.0-linux/tls-client-api-linux-amd64-1.11.0';
const tlsPath = '/tmp/tls-client';

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

function runTLSClient() {
  exec(`${tlsPath} --help`, (err, stdout, stderr) => {
    if (err) {
      console.error(`❌ TLS client exec failed:\n${stderr.trim()}`);
    } else {
      console.log('✅ TLS client help output:\n' + stdout.trim());
    }
  });
}

downloadTLSClient(runTLSClient);
