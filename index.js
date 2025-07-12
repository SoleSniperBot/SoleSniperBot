require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Telegraf, session } = require('telegraf');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// ✅ Enable session support
bot.use(session());

// ✅ Log all updates
bot.use((ctx, next) => {
  console.log('📥 Update received:', ctx.updateType);
  return next();
});

// ✅ Load all handlers (except ones needing order)
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

// ✅ Manual load (ordered)
require('./handlers/menu')(bot);
require('./handlers/myaccounts')(bot);
require('./handlers/rotateinline')(bot);
require('./handlers/cooktracker')(bot);
require('./handlers/gen')(bot);
require('./handlers/viewimap')(bot);

// ✅ JD Inline profile selector
const { handleJDProfileSelection } = require('./handlers/jdcheckout');
handleJDProfileSelection(bot);

// ✅ Stripe webhook
const { webhookHandler, initWebhook } = require('./handlers/webhook');
app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.post('/webhook', webhookHandler, initWebhook(bot));

// ✅ Health check
app.get('/', (req, res) => {
  res.send('✅ SoleSniperBot is live and running.');
});

// ✅ Cooktracker command
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

// ✅ Auto-trigger Nike account generator on deploy
const generateNikeAccount = require('./handlers/accountGenerator');
generateNikeAccount().catch(console.error);

// ✅ Launch bot
bot.launch().then(() => {
  console.log('🤖 SoleSniperBot is live on Telegram.');
});

// ✅ Start Express server on Railway-assigned port
const PORT = process.env.PORT || 8880;
app.listen(PORT, () => {
  console.log(`🌐 Express server running on port ${PORT}`);
});
