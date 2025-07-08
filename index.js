require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Telegraf, session } = require('telegraf');
const express = require('express');
const bodyParser = require('body-parser');
const { loadProxies } = require('./lib/proxyManager'); // ✅ Load proxies on startup

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Load proxies at startup ✅
loadProxies();

// Session middleware
bot.use(session());

// Log incoming updates
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// Load all handlers except those needing special order
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).forEach((file) => {
  if (
    file.endsWith('.js') &&
    !['webhook.js', 'menu.js', 'rotateinline.js'].includes(file)
  ) {
    const handler = require(path.join(handlersPath, file));
    if (typeof handler === 'function') handler(bot);
  }
});

// Manually load important handlers
require('./handlers/menu')(bot);
require('./handlers/myaccounts')(bot);
require('./handlers/rotateinline')(bot);
require('./handlers/cooktracker')(bot);
require('./handlers/gen')(bot);

// JD profile selector inline buttons
const { handleJDProfileSelection } = require('./handlers/jdcheckout');
handleJDProfileSelection(bot);

// Webhook integration
const { webhookHandler, initWebhook } = require('./handlers/webhook');
app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf } }));
app.post('/webhook', webhookHandler, initWebhook(bot));

// Health check
app.get('/', (req, res) => {
  res.send('✅ SoleSniperBot is live. Webhook and bot are running.');
});

// Cooktracker command
const cookTrackerPath = path.join(__dirname, 'data/stats.json');
bot.command('cooktracker', async (ctx) => {
  if (!fs.existsSync(cookTrackerPath)) {
    return ctx.reply('📊 No cook data yet.');
  }

  const stats = JSON.parse(fs.readFileSync(cookTrackerPath, 'utf8'));
  const userId = ctx.from.id.toString();
  const cooked = stats[userId] || [];

  if (cooked.length === 0) {
    return ctx.reply('📊 No successful checkouts recorded for you yet.');
  }

  const msg = `🔥 You’ve cooked ${cooked.length} item(s):\n` +
    cooked.map((sku, i) => `#${i + 1}: ${sku}`).join('\n');

  await ctx.reply(msg);
});

// Start express
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🌐 Express server listening on port ${PORT}`);
});
