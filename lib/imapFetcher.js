const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');

const imapConfigPath = path.join(__dirname, '../data/imap.json');
const imapCreds = JSON.parse(fs.readFileSync(imapConfigPath));

async function fetchNike2FA(targetEmail) {
  const creds = imapCreds[targetEmail.split('@')[0]];
  if (!creds) {
    console.error(`❌ IMAP credentials not found for ${targetEmail}`);
    return null;
  }

  const { email, password, host, port = 993, tls = true } = creds;

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: email,
      password,
      host,
      port,
      tls,
      tlsOptions: { rejectUnauthorized: false },
    });

    function openInbox(cb) {
      imap.openBox('INBOX', false, cb);
    }

    imap.once('ready', () => {
      openInbox((err, box) => {
        if (err) {
          reject(err);
          return;
        }

        imap.search(['UNSEEN', ['FROM', 'nike@official.nike.com']], (err, results) => {
          if (err || !results.length) {
            resolve(null); // no emails found
            return;
          }

          const latest = results.slice(-1);
          const fetch = imap.fetch(latest, { bodies: '' });

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  resolve(null);
                  return;
                }

                const match = parsed.text.match(/(\d{6})/);
                if (match) {
                  console.log(`📬 [IMAP] 2FA code received for ${targetEmail}: ${match[1]}`);
                  resolve(match[1]);
                } else {
                  resolve(null);
                }
              });
            });
          });

          fetch.once('error', () => resolve(null));
          fetch.once('end', () => imap.end());
        });
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP error:', err);
      resolve(null);
    });

    imap.connect();
  });
}

module.exports = { fetchNike2FA };
