const fs = require('fs');
const path = require('path');

const bulkPath = path.join(__dirname, '../data/accounts.json');

module.exports = (bot) => {
  bot.command('bulkupload', async (ctx) => {
    ctx.replyWithMarkdown('📤 *Upload your .txt or .csv file containing accounts and proxies.*\nFormat:\n`email:password:proxyhost:port`');
  });

  bot.on('document', async (ctx) => {
    const fileId = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name;
    const fileLink = await ctx.telegram.getFileLink(fileId);

    const response = await fetch(fileLink.href);
    const content = await response.text();

    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const entries = lines.map(line => {
      const [email, password, host, port] = line.split(':');
      return { email, password, proxy: `${host}:${port}` };
    });

    fs.writeFileSync(bulkPath, JSON.stringify(entries, null, 2));
    ctx.reply('✅ Bulk upload complete! Accounts saved.');
  });
};
