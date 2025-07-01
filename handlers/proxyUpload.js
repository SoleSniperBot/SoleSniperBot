const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/proxies.json');

// Load existing proxies or empty object
let proxies = {};
if (fs.existsSync(proxyPath)) {
  proxies = JSON.parse(fs.readFileSync(proxyPath, 'utf8'));
}

function saveProxies() {
  fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
}

function isValidProxy(line) {
  // Accept ip:port:user:pass or ip:port only
  return /^(\d{1,3}\.){3}\d{1,3}:\d{2,5}(:[^:\s]+(:[^:\s]+)?)?$/.test(line.trim());
}

module.exports = (bot) => {
  // To track users currently uploading proxies
  const proxyUploadUsers = new Set();

  bot.action('sendproxies', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      '📤 Send your proxies one per line in this format:\n`ip:port:user:pass`\nor\n`ip:port`\n\nAfter sending, they will be saved for your sessions.'
      , { parse_mode: 'Markdown' });
    proxyUploadUsers.add(ctx.from.id);
  });

  bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!proxyUploadUsers.has(ctx.from.id)) return;

    const lines = ctx.message.text.split('\n').map(l => l.trim()).filter(Boolean);
    const userProxies = proxies[userId] || [];

    let added = 0;
    for (const line of lines) {
      if (isValidProxy(line) && !userProxies.find(p => p.ip === line)) {
        userProxies.push({ ip: line, locked: false });
        added++;
      }
    }

    if (added > 0) {
      proxies[userId] = userProxies;
      saveProxies();
      await ctx.reply(`✅ Added ${added} new proxies.`);
    } else {
      await ctx.reply('⚠️ No valid or new proxies found in your message.');
    }

    proxyUploadUsers.delete(ctx.from.id);
  });
};
