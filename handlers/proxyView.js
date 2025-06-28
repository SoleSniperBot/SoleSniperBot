const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

const proxyPath = path.join(__dirname, '../data/proxies.json');

// Load or initialize proxy list
let proxies = {};
if (fs.existsSync(proxyPath)) {
  proxies = JSON.parse(fs.readFileSync(proxyPath, 'utf8'));
}

// Save function
function saveProxies() {
  fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
}

// View and clear proxies per user
module.exports = (bot) => {
  bot.action('myproxies', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userProxies = proxies[userId] || [];

    const total = userProxies.length;
    const locked = userProxies.filter(p => p.locked).length;
    const free = total - locked;

    await ctx.reply(
      `📊 *Your Proxy Summary:*\n` +
      `• Total: ${total}\n` +
      `• 🔒 Locked: ${locked}\n` +
      `• ✅ Free: ${free}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🧹 Clear All Proxies', 'clear_proxies')]
        ])
      }
    );
    ctx.answerCbQuery();
  });

  bot.action('clear_proxies', async (ctx) => {
    const userId = ctx.from.id.toString();
    delete proxies[userId];
    saveProxies();
    await ctx.reply('🧹 Your proxies have been cleared.');
    ctx.answerCbQuery();
  });
};
