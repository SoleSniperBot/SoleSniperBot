// handlers/bulkupload.js
const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  bot.command('bulkupload', async (ctx) => {
    ctx.reply('📤 Please upload a .txt or .csv file containing your Nike accounts and proxies.\n\nFormat:\nemail:password:proxy (one per line)');
  });

  bot.on('document', async (ctx) => {
    const userId = ctx.from.id;
    const file = ctx.message.document;

    const fileName = file.file_name.toLowerCase();
    const isTxtOrCsv = fileName.endsWith('.txt') || fileName.endsWith('.csv');

    if (!isTxtOrCsv) {
      return ctx.reply('❌ Please upload a .txt or .csv file only.');
    }

    try {
      const link = await ctx.telegram.getFileLink(file.file_id);
      const res = await fetch(link.href);
      const content = await res.text();

      const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
      const validEntries = [];

      for (const line of lines) {
        const parts = line.split(':');
        if (parts.length >= 3) {
          validEntries.push(line);
        }
      }

      if (!fs.existsSync('./data')) fs.mkdirSync('./data');

      const savePath = path.join('./data', `accounts_${userId}.txt`);
      fs.writeFileSync(savePath, validEntries.join('\n'), 'utf-8');

      ctx.reply(`✅ Uploaded ${validEntries.length} accounts successfully.`);
    } catch (error) {
      console.error('Upload error:', error);
      ctx.reply('❌ Failed to process the file. Please try again.');
    }
  });
};
