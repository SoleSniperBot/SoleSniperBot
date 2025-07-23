// handlers/imap.js
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { SocksProxyAgent } = require('socks-proxy-agent');
const fs = require('fs');
const path = require('path');

const imapPath = path.join(__dirname, '../data/imap.json');

// Load IMAP credentials
function loadIMAPAccounts() {
  if (!fs.existsSync(imapPath)) return [];
  const json = JSON.parse(fs.readFileSync(imapPath, 'utf8'));
  return json.imap_accounts || [];
}

// Sleep helper
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main fetch logic with auto-rotate
async function fetchNike2FA(emailAlias, passwordAlias, proxyOverride = null, maxAttempts = 3) {
  const imapAccounts = loadIMAPAccounts();

  for (let i = 0; i < imapAccounts.length; i++) {
    const account = imapAccounts[i];
    console.log(`📩 [IMAP] Trying account: ${account.email}`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const code = await tryFetch(account, proxyOverride);
        if (code) return code;
      } catch (err) {
        console.warn(`⚠️ [${account.email}] Attempt ${attempt + 1} failed: ${err.message}`);
      }

      if (attempt < maxAttempts - 1) {
        console.log('⏳ Waiting 10s before retrying...');
        await sleep(10000);
      }
    }

    console.warn(`❌ Skipping IMAP account: ${account.email}`);
  }

  throw new Error('❌ All IMAP accounts failed to retrieve code.');
}

// Core fetch with SOCKS5 support and safe .end()
function tryFetch(account, proxyOverride = null) {
  return new Promise((resolve, reject) => {
    const imapConfig = {
      user: account.email,
      password: account.password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      connTimeout: 10000,
      tlsOptions: { rejectUnauthorized: false }
    };

    // Apply proxy if available
    const proxy = proxyOverride || account.proxy;
    if (proxy) {
      const [host, port, user, pass] = proxy.split(':');
      const uri = `socks5://${user}:${pass}@${host}:${port}`;
      imapConfig.agent = new SocksProxyAgent(uri);
    }

    const imap = new Imap(imapConfig);
    let ended = false;

    function safeEnd() {
      if (!ended) {
        ended = true;
        imap.end();
      }
    }

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err) => {
        if (err) return reject(err);

        const searchSince = new Date(Date.now() - 60 * 60 * 1000); // past hour

        imap.search(['UNSEEN', ['SINCE', searchSince.toISOString()]], (err, results) => {
          if (err || !results || results.length === 0) {
            safeEnd();
            return reject(new Error('No unseen Nike email found'));
          }

          const f = imap.fetch(results.slice(-5), { bodies: '' });

          f.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) {
                  console.warn(`📨 Failed to parse email body: ${err.message}`);
                  return;
                }

                const body = parsed.text || '';
                const codeMatch = body.match(/\b\d{4,8}\b/);
                if (parsed.subject?.toLowerCase().includes('nike') && codeMatch) {
                  safeEnd();
                  return resolve(codeMatch[0]);
                }
              });
            });
          });

          f.once('error', (err) => {
            safeEnd();
            reject(err);
          });
        });
      });
    });

    imap.once('error', (err) => {
      safeEnd();
      reject(err);
    });

    imap.once('end', () => {
      console.log('📧 IMAP closed');
    });

    imap.connect();
  });
}

module.exports = { fetch2FACodeFromIMAP: fetchNike2FA };
