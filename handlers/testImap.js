// handlers/testImap.js
const Imap = require('imap');

module.exports = (bot) => {
  bot.command('testimap', async (ctx) => {
    const imap = new Imap({
      user: 'yourgmail@gmail.com',
      password: 'yourpassword',
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
    });

    imap.once('ready', () => {
      ctx.reply('✅ IMAP connection successful!');
      imap.end();
    });

    imap.once('error', (err) => {
      ctx.reply(`❌ IMAP error: ${err.message}`).catch(console.error);
    });

    imap.connect();
  });
};
