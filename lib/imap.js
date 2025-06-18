const Imap = require('imap');
const { simpleParser } = require('mailparser');

function fetchNike2FA(email, password, proxy = null) {
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

    const imap = new Imap(imapConfig);

    function openInbox(cb) {
      imap.openBox('INBOX', true, cb);
    }

    imap.once('ready', function () {
      openInbox(function (err, box) {
        if (err) return reject(err);

        const delay = 1 * 3600 * 1000;
        const yesterday = new Date(Date.now() - delay);
        yesterday.setHours(0, 0, 0, 0);

        imap.search(
          ['UNSEEN', ['SINCE', yesterday.toISOString()]],
          function (err, results) {
            if (err) return reject(err);
            if (!results || results.length === 0) {
              return reject(new Error('No new emails found'));
            }

            const f = imap.fetch(results, { bodies: '' });
            f.on('message', function (msg, seqno) {
              msg.on('body', function (stream) {
                simpleParser(stream, async (err, parsed) => {
                  if (err) return reject(err);
                  const subject = parsed.subject || '';
                  const body = parsed.text || '';

                  const codeMatch = body.match(/\b\d{6}\b/);
                  if (subject.toLowerCase().includes('nike') && codeMatch) {
                    imap.end();
                    return resolve(codeMatch[0]);
                  }
                });
              });
            });

            f.once('error', function (err) {
              reject(err);
            });

            f.once('end', function () {
              imap.end();
            });
          }
        );
      });
    });

    imap.once('error', function (err) {
      reject(err);
    });

    imap.connect();
  });
}

module.exports = {
  fetchNike2FA,
};
