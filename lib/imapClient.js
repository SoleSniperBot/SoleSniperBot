const Imap = require('imap');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { simpleParser } = require('mailparser');

function connectWithImap({ email, password, imapHost, imapPort, proxy }) {
  return new Promise((resolve, reject) => {
    const config = {
      user: email,
      password: password,
      host: imapHost,
      port: parseInt(imapPort),
      tls: true,
      tlsOptions: { rejectUnauthorized: false }, // helpful for Gmail and self-signed certs
      connTimeout: 10000,
    };

    if (proxy) {
      try {
        const [proxyHost, proxyPort, proxyUser, proxyPass] = proxy.split(':');
        const proxyUri = `socks5://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`;
        config.agent = new SocksProxyAgent(proxyUri);
      } catch (e) {
        console.error('⚠️ Invalid proxy format in IMAP:', proxy);
        return reject(e);
      }
    }

    const imap = new Imap(config);

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        imap.search(['UNSEEN', ['SINCE', new Date()]], (err, results) => {
          if (err || !results || results.length === 0) {
            imap.end();
            return resolve(null);
          }

          const f = imap.fetch(results.slice(-5), { bodies: '' });
          let resolved = false;

          f.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err || resolved) return;
                const codeMatch = parsed.text?.match(/\b\d{4,8}\b/);
                if (codeMatch) {
                  resolved = true;
                  imap.end();
                  return resolve(codeMatch[0]);
                }
              });
            });
          });

          f.once('end', () => {
            if (!resolved) {
              imap.end();
              resolve(null);
            }
          });

          f.once('error', (err) => {
            if (!resolved) {
              imap.end();
              reject(err);
            }
          });
        });
      });
    });

    imap.once('error', (err) => reject(err));
    imap.once('end', () => console.log('📧 IMAP connection closed.'));
    imap.connect();
  });
}

module.exports = { connectWithImap };
