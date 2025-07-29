require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Telegraf, session } = require('telegraf');
const express = require('express');
const bodyParser = require('body-parser');
const { EventEmitter } = require('events');
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { execSync } = require('child_process');

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
app.use(bodyParser.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));
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

  const msg = `🔥 You’ve cooked ${cooked.length} item(s):\n` +
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

// 🔐 Proxy test with GeoNode
(async () => {
  const proxies = [
    'socks5://USERNAME:PASSWORD@proxy.geonode.io:9000',
    'socks5://USERNAME:PASSWORD@proxy.geonode.io:12000'
  ];

  for (const proxy of proxies) {
    try {
      const agent = new SocksProxyAgent(proxy);
      const res = await axios.get('https://www.nike.com/gb', {
        httpAgent: agent,
        httpsAgent: agent,
        timeout: 8000,
        headers: { 'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)' }
      });
      console.log(`✅ SOCKS5 proxy test passed: ${proxy}`);
      break;
    } catch (err) {
      console.warn(`❌ Proxy failed: ${proxy}`, err.message);
    }
  }
})();

// ⚙️ TLS client setup in /tmp (Railway-safe)
(async () => {
  const BIN_PATH = '/tmp/tls-client';

  try {
    if (!fs.existsSync(BIN_PATH)) {
      console.log('📦 Downloading TLS client...');
      execSync(`curl -L https://github.com/SoleSniperBot/Tls-Client-Builds/releases/download/v1.4.3/tls-client-linux-x64 -o ${BIN_PATH}`);
      execSync(`chmod +x ${BIN_PATH}`);
    }

    const result = execSync(`${BIN_PATH} --help`).toString();
    console.log('✅ TLS client is working:\n' + result.split('\n')[0]);
  } catch (err) {
    console.error('❌ TLS client failed to execute:', err.message);
  }
})();
