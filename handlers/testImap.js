const Imap = require('imap');

module.exports = (ctx) => {
  const imap = new Imap({
    user: 'solesniper@gmail.com',
    password: 'your_app_password_here', // Use your app password
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
  });

  function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
  }

  imap.once('ready', function () {
    openInbox(function (err, box) {
      if (err) {
        // Safe to call ctx.reply here
        ctx.reply(`IMAP error: ${err.message}`).catch(console.error);
        imap.end();
        return;
      }
      ctx.reply(`✅ IMAP is working! Total messages: ${box.messages.total}`).catch(console.error);
      imap.end();
    });
  });

  imap.once('error', function (err) {
    // Safe to call ctx.reply here
    ctx.reply(`❌ IMAP error: ${err.message}`).catch(console.error);
  });

  imap.connect();
};
