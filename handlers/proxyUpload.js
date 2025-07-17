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

// ✅ Accepts both IPs and hostnames with optional user:pass
function isValidProxy(line) {
  return /^([a-zA-Z0-9._-]+):\d{2,5}(:[^:\s]+(:[^:\s]+)?)?$/.test(line.trim());
}

module.exports = (bot) => {
  const proxyUploadUsers = new Set();

  bot.action('sendproxies', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      '📤 Send your proxies one per line in this format:\n' +
      '`ip:port:user:pass` or `ip:port`\n\nExample:\n' +
      '`proxy.geonode.io:9000:user:pass`\n\nOnce sent, they’ll be saved and locked to your sessions.',
      { parse_mode: 'Markdown' }
    );
    proxyUploadUsers.add(ctx.from.id);
  });

  bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!proxyUploadUsers.has(ctx.from.id)) return;

    const lines = ctx.message.text.split('\n').map(l => l.trim()).filter(Boolean);
    const userProxies = proxies[userId] || [];

    let added = 0;
    for (const line of lines) {
      const cleanLine = line.replace(/\s/g, '').trim();
      if (isValidProxy(cleanLine) && !userProxies.find(p => p.ip === cleanLine)) {
        userProxies.push({ ip: cleanLine, locked: false });
        console.log(`✅ Saved proxy for ${userId}: ${cleanLine}`);
        added++;
      } else {
        console.log(`⚠️ Skipped invalid or duplicate proxy: ${cleanLine}`);
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
