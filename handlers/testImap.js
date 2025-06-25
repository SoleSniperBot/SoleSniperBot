const Imap = require('imap');

function testImapConnection() {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: 'solesniper@gmail.com',
      password: 'your_app_password_here', // Use Gmail App Password
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
    });

    function openInbox(cb) {
      imap.openBox('INBOX', true, cb);
    }

    imap.once('ready', () => {
      openInbox((err, box) => {
        if (err) {
          imap.end();
          reject(new Error(`IMAP error: ${err.message}`));
          return;
        }
        imap.end();
        resolve(box.messages.total);
      });
    });

    imap.once('error', (err) => {
      reject(new Error(`IMAP error: ${err.message}`));
    });

    imap.connect();
  });
}

module.exports = async (ctx) => {
  try {
    const totalMessages = await testImapConnection();
    await ctx.reply(`✅ IMAP is working! Total messages: ${totalMessages}`);
  } catch (err) {
    await ctx.reply(`❌ ${err.message}`);
  }
};
