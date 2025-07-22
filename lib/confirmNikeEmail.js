const fs = require('fs');
const path = require('path');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

const imapPath = path.join(__dirname, '../data/imap.json');
const creds = JSON.parse(fs.readFileSync(imapPath, 'utf-8'));

function getIMAPConnection() {
  return new Imap({
    user: creds.email,
    password: creds.password,
    host: creds.host || 'imap.gmail.com',
    port: creds.port || 993,
    tls: true
  });
}

module.exports = function confirmNikeEmail(targetEmail) {
  return new Promise((resolve, reject) => {
    const imap = getIMAPConnection();
    imap.once('ready', () => {
      imap.openBox('INBOX', false, () => {
        imap.search(['UNSEEN', ['FROM', 'nike@official.nike.com']], (err, results) => {
          if (err || !results.length) {
            imap.end();
            return reject(new Error('No Nike email found'));
          }

          const f = imap.fetch(results.slice(-5), { bodies: '' });
          f.on('message', (msg) => {
            msg.on('body', async (stream) => {
              const parsed = await simpleParser(stream);
              const linkMatch = parsed.text.match(/https:\/\/www\.nike\.com\/[^ \n]+/);
              if (linkMatch) {
                console.log('📩 Nike verification link found:', linkMatch[0]);
                resolve(linkMatch[0]);
                imap.end();
              } else {
                reject(new Error('No confirmation link found'));
              }
            });
          });

          f.once('error', (err) => {
            reject(new Error('IMAP fetch error: ' + err.message));
          });
        });
      });
    });

    imap.once('error', (err) => {
      reject(new Error('IMAP connection error: ' + err.message));
    });

    imap.connect();
  });
};
