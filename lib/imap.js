const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { SocksProxyAgent } = require('socks-proxy-agent');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchNike2FA(email, password, proxy = null, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const code = await tryFetch(email, password, proxy);
      if (code) return code;
    } catch (err) {
      console.warn(`⚠️ Attempt ${i + 1} failed: ${err.message}`);
    }

    if (i < attempts - 1) {
      console.log('⏳ Waiting 10s before retrying...');
      await sleep(10000);
    }
  }

  throw new Error('❌ Failed to retrieve Nike 2FA code after multiple attempts.');
}

function tryFetch(email, password, proxy) {
  return new Promise((resolve, reject) => {
    const imapConfig = {
      user: email,
      password: password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      connTimeout: 10000,
      tlsOptions: { rejectUnauthorized: false }
    };

    // Proxy agent
    if (proxy) {
      const [host, port, user, pass] = proxy.split(':');
      const proxyUri = `socks5://${user}:${pass}@${host}:${port}`;
      imapConfig.agent = new SocksProxyAgent(proxyUri);
    }

    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err) => {
        if (err) return reject(err);

        const searchSince = new Date(Date.now() - 1 * 60 * 60 * 1000); // past 1h

        imap.search(['UNSEEN', ['SINCE', searchSince.toISOString()]], (err, results) => {
          if (err || !results || results.length === 0) {
            imap.end();
            return reject(new Error('No Nike emails found'));
          }

          const f = imap.fetch(results.slice(-5), { bodies: '' });

          f.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) return;
                const body = parsed.text || '';
                const codeMatch = body.match(/\b\d{4,8}\b/);
                if (parsed.subject?.toLowerCase().includes('nike') && codeMatch) {
                  imap.end();
                  return resolve(codeMatch[0]);
                }
              });
            });
          });

          f.once('error', (err) => reject(err));
        });
      });
    });

    imap.once('error', (err) => reject(err));
    imap.once('end', () => console.log('📧 Gmail IMAP closed'));
    imap.connect();
  });
}

module.exports = { fetchNike2FA };
