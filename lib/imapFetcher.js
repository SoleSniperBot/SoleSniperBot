// lib/imapFetcher.js
const fs = require('fs');
const path = require('path');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

const imapConfigPath = path.join(__dirname, '../data/imap.json');

// ✅ Auto-create imap.json if it doesn't exist
if (!fs.existsSync(imapConfigPath)) {
  fs.writeFileSync(imapConfigPath, JSON.stringify({}, null, 2));
}

const imapCreds = JSON.parse(fs.readFileSync(imapConfigPath));

function getImapConnection(email, proxy = null) {
  const creds = imapCreds[email];
  if (!creds) throw new Error(`❌ No IMAP config found for ${email}`);

  return new Imap({
    user: creds.email,
    password: creds.password,
    host: creds.host || 'imap.gmail.com',
    port: creds.port || 993,
    tls: true,
    autotls: 'always',
    connTimeout: 20000,
    ...(proxy && { proxy }) // Optional proxy tunneling
  });
}

async function fetchNikeCode(email) {
  return new Promise((resolve, reject) => {
    const imap = getImapConnection(email);

    imap.once('ready', () => {
      imap.openBox('INBOX', true, () => {
        imap.search(['UNSEEN', ['FROM', 'nike@official.nike.com']], (err, results) => {
          if (err || !results || results.length === 0) {
            imap.end();
            return reject('❌ No new Nike code found');
          }

          const f = imap.fetch(results.slice(-1), { bodies: '' });

          f.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) return reject(err);

                const codeMatch = parsed.text?.match(/(\d{6})/) || [];
                const code = codeMatch[1];

                if (code) resolve(code);
                else reject('❌ No code found in message');

                imap.end();
              });
            });
          });

          f.once('error', (ex) => reject('❌ Fetch error: ' + ex.message));
        });
      });
    });

    imap.once('error', (err) => reject('❌ IMAP error: ' + err.message));
    imap.once('end', () => console.log(`📬 IMAP session ended for ${email}`));
    imap.connect();
  });
}

module.exports = { fetchNikeCode };
