const Imap = require('imap');

module.exports = (ctx) => {
  const imap = new Imap({
    user: 'solesniper@gmail.com',
    password: 'your_app_password_here',
    host: 'imap.gmail.com',
    port: 993,
    tls: true
  });

  function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
  }

  imap.once('ready', function () {
    openInbox(function (err, box) {
      if (err) {
        ctx.reply(`IMAP error: ${err.message}`);
        imap.end();
        return;
      }
      ctx.reply(`✅ IMAP is working! Total messages: ${box.messages.total}`);
      imap.end();
    });
  });

  imap.once('error', function (err) {
    ctx.reply(`❌ IMAP error: ${err.message}`);
  });

  imap.connect();
};
