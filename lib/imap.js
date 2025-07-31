 const Imap = require('imap-simple');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');

const imapCredsPath = path.join(__dirname, '../data/imap.json');
const creds = JSON.parse(fs.readFileSync(imapCredsPath));

async function fetchNike2FACode(targetEmail) {
  const config = {
    imap: {
      user: creds.email,
      password: creds.password,
      host: creds.host,
      port: creds.port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    },
    onmail: () => {}
  };

  const connection = await Imap.connect(config);
  await connection.openBox('INBOX');

  const delay = 2 * 60 * 1000;
  const since = new Date(Date.now() - delay);
  const searchCriteria = ['UNSEEN', ['SINCE', since.toISOString()]];
  const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

  const messages = await connection.search(searchCriteria, fetchOptions);

  for (let message of messages) {
    const all = message.parts.find(part => part.which === 'TEXT');
    const parsed = await simpleParser(all.body);

    if (parsed.from?.text.includes('nike') && parsed.subject?.includes('verification code')) {
      const match = parsed.text.match(/\b\d{6}\b/);
      if (match) {
        await connection.end();
        return match[0];
      }
    }
  }

  await connection.end();
  return null;
}

async function confirmNikeEmailLink(targetEmail) {
  const config = {
    imap: {
      user: creds.email,
      password: creds.password,
      host: creds.host,
      port: creds.port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    },
    onmail: () => {}
  };

  const connection = await Imap.connect(config);
  await connection.openBox('INBOX');

  const delay = 5 * 60 * 1000;
  const since = new Date(Date.now() - delay);
  const searchCriteria = ['UNSEEN', ['SINCE', since.toISOString()]];
  const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

  const messages = await connection.search(searchCriteria, fetchOptions);

  for (let message of messages) {
    const all = message.parts.find(part => part.which === 'TEXT');
    const parsed = await simpleParser(all.body);

    if (parsed.from?.text.includes('nike') && parsed.subject?.includes('Confirm your email')) {
      const match = parsed.text.match(/https:\/\/www\.nike\.com\/[^\s"]+/);
      if (match) {
        const confirmUrl = match[0].replace(/&amp;/g, '&');
        const { exec } = require('child_process');
        exec(`curl -L "${confirmUrl}"`);
        await connection.end();
        return true;
      }
    }
  }

  await connection.end();
  return false;
}

module.exports = {
  fetchNike2FACode,
  confirmNikeEmailLink
};
