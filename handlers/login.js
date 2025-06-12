// handlers/login.js
const fs = require('fs');
const path = require('path');

const profilesPath = path.join(__dirname, '../data/profiles.json');

if (!fs.existsSync(profilesPath)) {
  fs.writeFileSync(profilesPath, JSON.stringify({}));
}

module.exports = (bot) => {
  bot.command('login', (ctx) => {
    ctx.reply('🔐 Please send your Nike SNKRS login in the following format:\n\n`email@example.com:password`\n\nYou can also upload a `.txt` or `.csv` file with multiple logins.', {
      parse_mode: 'Markdown'
    });
  });

  bot.on('text', (ctx) => {
    const message = ctx.message.text.trim();
    const userId = String(ctx.from.id);
    const profiles = JSON.parse(fs.readFileSync(profilesPath));

    if (message.includes('@') && message.includes(':')) {
      const [email, password] = message.split(':');

      if (!email || !password) {
        return ctx.reply('⚠️ Invalid login format. Use `email:password`');
      }

      if (!profiles[userId]) {
        profiles[userId] = { logins: [] };
      }

      profiles[userId].logins.push({ email, password });
      fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));

      return ctx.reply('✅ Login saved!');
    }
  });

  bot.on('document', async (ctx) => {
    const file = await ctx.telegram.getFile(ctx.message.document.file_id);
    const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

    const res = await fetch(url);
    const content = await res.text();
    const userId = String(ctx.from.id);
    const profiles = JSON.parse(fs.readFileSync(profilesPath));

    if (!profiles[userId]) {
      profiles[userId] = { logins: [] };
    }

    const lines = content.split('\n');
    for (const line of lines) {
      const [email, password] = line.trim().split(':');
      if (email && password) {
        profiles[userId].logins.push({ email, password });
      }
    }

    fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
    ctx.reply('✅ Bulk logins uploaded successfully.');
  });
};o
