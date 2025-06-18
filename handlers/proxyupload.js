const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const proxyPath = path.join(__dirname, '../data/userProxies.json');

module.exports = (bot) => {
  bot.command('uploadproxies', async (ctx) => {
    return ctx.reply('📤 Please upload a `.txt` or `.csv` file with your UK residential proxies.\nFormat:\n`ip:port:user:pass` or `ip:port`');
  });

  bot.on('document', async (ctx) => {
    const fileName = ctx.message.document.file_name;
    const fileId = ctx.message.document.file_id;

    if (!fileName.endsWith('.txt') && !fileName.endsWith('.csv')) {
      return ctx.reply('❌ Please upload a `.txt` or `.csv` file.');
    }

    const fileLink = await ctx.telegram.getFileLink(fileId);
    const response = await fetch(fileLink.href);
    const proxyText = await response.text();

    const proxies = proxyText.split('\n').map(line => line.trim()).filter(Boolean);

    let stored = {};
    if (fs.existsSync(proxyPath)) {
      stored = JSON.parse(fs.readFileSync(proxyPath));
    }

    stored[ctx.from.id] = proxies;

    fs.writeFileSync(proxyPath, JSON.stringify(stored, null, 2));
    return ctx.reply(`✅ Uploaded ${proxies.length} proxies for your bot sessions.`);
  });
};
