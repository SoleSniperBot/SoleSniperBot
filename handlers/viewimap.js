const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  bot.command('viewimap', async (ctx) => {
    const imapPath = path.join(__dirname, '../data/imap.json');

    if (!fs.existsSync(imapPath)) {
      return ctx.reply('⚠️ No IMAP credentials found.');
    }

    const data = JSON.parse(fs.readFileSync(imapPath, 'utf8'));
    if (Object.keys(data).length === 0) {
      return ctx.reply('📭 IMAP list is empty.');
    }

    const lines = Object.entries(data).map(([email, config], i) => {
      return `📧 ${email}\n🔐 App Password: ${config.password}\n🌐 Proxy: ${config.proxy || 'None'}`;
    });

    const chunks = [];
    let current = '';
    for (const line of lines) {
      if ((current + '\n\n' + line).length > 3500) {
        chunks.push(current);
        current = '';
      }
      current += '\n\n' + line;
    }
    if (current) chunks.push(current);

    for (const chunk of chunks) {
      await ctx.reply(chunk.trim());
    }
  });
};
