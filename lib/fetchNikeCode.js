const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { getIMAPCredentials } = require('./imapHelper');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchNikeCode(email) {
  const { email: imapEmail, password, proxy } = getIMAPCredentials(email);

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: imapEmail,
      password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
    });

    function openInbox(cb) {
      imap.openBox('INBOX', false, cb);
    }

    imap.once('ready', () => {
      openInbox((err, box) => {
        if (err) return reject(err);

        imap.search(['UNSEEN', ['SINCE', new Date()]], (err, results) => {
          if (err) return reject(err);
          if (!results || !results.length) return reject('❌ No new emails found');

          const f = imap.fetch(results.slice(-5), { bodies: '' });
          f.on('message', msg => {
            msg.on('body', stream => {
              simpleParser(stream, async (err, parsed) => {
                const { subject, text } = parsed;
                if (subject && subject.toLowerCase().includes('your nike verification code')) {
                  const codeMatch = text.match(/(\d{6})/);
                  if (codeMatch) {
                    resolve(codeMatch[1]);
                    imap.end();
                  }
                }
              });
            });
          });

          f.once('end', () => {
            reject('❌ Nike verification email not found');
            imap.end();
          });
        });
      });
    });

    imap.once('error', err => reject(err));
    imap.connect();
  });
}

module.exports = { fetchNikeCode };
