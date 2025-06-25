const Imap = require('imap');
const { inspect } = require('util');

const imap = new Imap({
  user: 'solesniper@gmail.com',        // Your Gmail
  password: 'your_app_password_here',  // App password, NOT your real password
  host: 'imap.gmail.com',
  port: 993,
  tls: true
});

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

imap.once('ready', function () {
  openInbox(function (err, box) {
    if (err) throw err;
    console.log('✅ IMAP is working! Total messages: ' + box.messages.total);
    imap.end();
  });
});

imap.once('error', function (err) {
  console.log('❌ IMAP error:', err);
});

imap.connect();
