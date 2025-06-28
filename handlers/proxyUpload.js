const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/proxies.json');

// Load existing proxies
let proxies = {};
if (fs.existsSync(proxyPath)) {
  proxies = JSON.parse(fs.readFileSync(proxyPath, 'utf8'));
}

function saveProxies() {
  fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
}

function isValidProxy(line) {
  return /^(\d{1,3}\.){3}\d{1,3}:\d{2,5}$/.test(line.trim());
}

module.exports = (bot) => {
  bot.hears(/^(\d{1,3}\.){3}\d{1,3}:\d{2,5}([\s\S]*)/, async (ctx) => {
    const userId = ctx.from.id.toString();
    const lines = ctx.message.text.split('\n').map(l => l.trim()).filter(Boolean);
    const userProxies = proxies[userId] || [];

    let added = 0;

    for (let line of lines) {
      if (isValidProxy(line) && !userProxies.find(p => p.ip === line)) {
        userProxies.push({ ip: line, locked: false });
        added++;
      }
    }

    proxies[userId] = userProxies;
    saveProxies();

    if (added > 0) {
      await ctx.reply(`✅ Added ${added} new proxies.`);
    } else {
      await ctx.reply('⚠️ No valid or new proxies found in your message.');
    }
  });
};
