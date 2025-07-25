require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Telegraf, session } = require('telegraf');
const express = require('express');
const bodyParser = require('body-parser');
const { EventEmitter } = require('events');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// ✅ Enable session middleware
bot.use(session());

// 📥 Log all incoming updates
bot.use((ctx, next) => {
  console.log(`📥 Telegram update received: ${ctx.updateType}`);
  return next();
});

// ✅ Load standard handlers (excluding those with special load order)
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

// 🔁 Load core handlers in order
console.log('📦 Loading core handlers...');
require('./handlers/menu')(bot);
require('./handlers/myaccounts')(bot);
require('./handlers/rotateinline')(bot);
require('./handlers/cooktracker')(bot);
require('./handlers/viewimap')(bot);

// 🛒 JD-specific handler (with inline profile support)
const { handleJDProfileSelection } = require('./handlers/jdcheckout');
handleJDProfileSelection(bot);

// 💳 Stripe Webhook Integration
const { webhookHandler, initWebhook } = require('./handlers/webhook');
app.use(bodyParser.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));
app.post('/webhook', webhookHandler, initWebhook(bot));

// 🔁 Health Check Endpoint
app.get('/', (req, res) => {
  console.log('✅ Health check ping received.');
  res.send('✅ SoleSniperBot is live and running.');
});

// 📊 /cooktracker command for user stats
const cookTrackerPath = path.join(__dirname, 'data/stats.json');
bot.command('cooktracker', async (ctx) => {
  if (!fs.existsSync(cookTrackerPath)) {
    return ctx.reply('📊 No cook data yet.');
  }

  const stats = JSON.parse(fs.readFileSync(cookTrackerPath, 'utf8'));
  const userId = ctx.from.id.toString();
  const cooked = stats[userId] || [];

  if (!cooked.length) {
    return ctx.reply('📊 No successful checkouts recorded for you yet.');
  }

  const msg = `🔥 You’ve cooked ${cooked.length} item(s):\n` +
    cooked.map((sku, i) => `#${i + 1}: ${sku}`).join('\n');

  await ctx.reply(msg);
});

// 🚨 Real-time NikeGen debug log listener
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

// ✅ AUTO SOCKS5 PROXY TEST ON DEPLOY
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
(async () => {
  try {
    const proxy = 'socks5://geonode_fUy6U0SWyY:2e3344b4-40ed-4ab8-9299-fdda9d2188a4@proxy.geonode.io:12000';
    const agent = new SocksProxyAgent(proxy);
    const res = await axios.get('https://www.nike.com/gb', {
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 8000,
      headers: {
        'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)'
      }
    });
    console.log(`✅ SOCKS5 proxy test passed: ${res.status}`);
  } catch (err) {
    console.error('❌ SOCKS5 proxy test failed:', err.message);
  }
})();

// ✅ AUTO-GENERATE NIKE ACCOUNT ON DEPLOY
const generateNikeAccount = require('./lib/generateNikeAccount');
generateNikeAccount('startup-auto');
