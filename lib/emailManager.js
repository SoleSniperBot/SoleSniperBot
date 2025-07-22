const fs = require('fs');
const path = require('path');

const usedEmailsPath = path.join(__dirname, '../data/usedEmails.json');
if (!fs.existsSync(usedEmailsPath)) {
  fs.writeFileSync(usedEmailsPath, JSON.stringify([]));
}

// Base root email (update this to match your inbox root!)
const root = 'botsolesniper'; // no @gmail.com here

function generateNewAlias() {
  const timestamp = Date.now();
  const rand = Math.floor(Math.random() * 10000);
  return `${root}+${timestamp}${rand}@gmail.com`;
}

function getUsedEmails() {
  return JSON.parse(fs.readFileSync(usedEmailsPath, 'utf-8'));
}

function markEmailUsed(email) {
  const used = getUsedEmails();
  used.push(email);
  fs.writeFileSync(usedEmailsPath, JSON.stringify(used, null, 2));
}

async function getNextEmail() {
  let tries = 0;
  const used = getUsedEmails();

  while (tries < 10) {
    const email = generateNewAlias();
    if (!used.includes(email)) {
      return email;
    }
    tries++;
  }

  throw new Error('No fresh emails available after 10 attempts');
}

module.exports = {
  getNextEmail,
  markEmailUsed
};
