// handlers/testImap.js
const Imap = require('imap');

module.exports = (bot) => {
  bot.command('testimap', async (ctx) => {
    const imap = new Imap({
      user: process.env.IMAP_EMAIL,         // set in .env
      password: process.env.IMAP_PASSWORD,   // set in .env
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

    try {
      imap.connect();
    } catch (err) {
      ctx.reply(`❌ Connection failed: ${err.message}`).catch(console.error);
    }
  });
};
