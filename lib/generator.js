// lib/generator.js
const fs = require('fs');
const path = require('path');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { fetch2FACodeFromIMAP } = require('./imap');
const { createNikeSession, confirmNikeEmail } = require('./nikeApi');

const emailDataPath = path.join(__dirname, '../data/emailimap.json');
const savePath = path.join(__dirname, '../data/accounts.json');

function getNextEmail() {
  const emails = JSON.parse(fs.readFileSync(emailDataPath));
  return emails[Math.floor(Math.random() * emails.length)];
}

function saveAccount(account) {
  const existing = fs.existsSync(savePath)
    ? JSON.parse(fs.readFileSync(savePath))
    : [];

  existing.push(account);
  fs.writeFileSync(savePath, JSON.stringify(existing, null, 2));
}

async function generateNikeAccount(userId) {
  const proxy = getLockedProxy(userId);
  if (!proxy) throw new Error('No proxy available');

  const { email, password, imapHost, name } = getNextEmail();
  const [first, last] = name.split(' ');

  const session = await createNikeSession(email, first, last, proxy);
  const code = await fetch2FACodeFromIMAP(email, password, imapHost);
  const verified = await confirmNikeEmail(session, code, proxy);

  if (verified) {
    const account = { email, password, name, proxy };
    saveAccount(account);
    releaseLockedProxy(userId);
    return account;
  } else {
    releaseLockedProxy(userId);
    throw new Error('Verification failed');
  }
}

module.exports = { generateNikeAccount };
