const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  // Listen for proxy upload triggered from inline button
  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

    // Detect if this is a proxy upload
    const looksLikeProxies = lines.every(line =>
      line.match(/^(\d{1,3}\.){3}\d{1,3}:\d{2,5}(?::\S+:\S+)?$/)
    );

    if (!looksLikeProxies) return;

    const userId = ctx.from.id;
    const filePath = path.join(__dirname, `../data/proxies_user_${userId}.json`);

    const formatted = lines.map(proxy => ({
      ip: proxy,
      locked: false,
      lastUsed: null
    }));

    // Save user's proxy list
    fs.writeFileSync(filePath, JSON.stringify(formatted, null, 2));

    await ctx.reply(`✅ Saved ${formatted.length} proxies for you.\nThey are now tied to your Telegram ID.`);
  });
};
