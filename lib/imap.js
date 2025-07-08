const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { SocksProxyAgent } = require('socks-proxy-agent');
const fs = require('fs');
const path = require('path');

const imapPath = path.join(__dirname, '../data/imap.json');
if (!fs.existsSync(imapPath)) fs.writeFileSync(imapPath, JSON.stringify({}, null, 2));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadImapData(userId) {
  const data = JSON.parse(fs.readFileSync(imapPath));
  return data[userId] || null;
}

async function fetchNike2FA(email, password, proxy = null, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const code = await tryFetch(email, password, proxy);
      if (code) return code;
    } catch (err) {
      console.warn(`⚠️ IMAP attempt ${i + 1} failed: ${err.message}`);
    }
    if (i < attempts - 1) {
      await sleep(10000);
    }
  }
  throw new Error('❌ Nike 2FA code fetch failed after retries.');
}

function tryFetch(email, password, proxy) {
  return new Promise((resolve, reject) => {
    const imapConfig = {
      user: email,
      password: password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000
    };

    // Use proxy if provided
    if (proxy) {
      try {
        const [host, port, user, pass] = proxy.replace('http://', '').replace('socks5://', '').split(':');
        const proxyUri = `socks5://${user}:${pass}@${host}:${port}`;
        imapConfig.agent = new SocksProxyAgent(proxyUri);
      } catch (err) {
        return reject(new Error('Invalid proxy format'));
      }
    }

    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err) => {
        if (err) return reject(err);

        const since = new Date(Date.now() - 60 * 60 * 1000);
        imap.search(['UNSEEN', ['SINCE', since.toISOString()]], (err, results) => {
          if (err || !results || results.length === 0) {
            imap.end();
            return reject(new Error('No Nike emails found'));
          }

          const fetcher = imap.fetch(results.slice(-5), { bodies: '' });

          fetcher.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) return;
                const body = parsed.text || '';
                const match = body.match(/\b\d{4,8}\b/);
                if (parsed.subject?.toLowerCase().includes('nike') && match) {
                  imap.end();
                  return resolve(match[0]);
                }
              });
            });
          });

          fetcher.once('error', (err) => reject(err));
        });
      });
    });

    imap.once('error', (err) => reject(err));
    imap.once('end', () => console.log('📧 IMAP connection closed'));
    imap.connect();
  });
}

module.exports = {
  fetchNike2FA,
  loadImapData
};
