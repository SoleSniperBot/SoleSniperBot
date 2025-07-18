const fs = require('fs');
const path = require('path');

const usedPath = path.join(__dirname, '../data/usedEmails.json');
const baseEmail = 'botsolesniper@gmail.com';

if (!fs.existsSync(usedPath)) fs.writeFileSync(usedPath, JSON.stringify([]));

function getUsed() {
  return JSON.parse(fs.readFileSync(usedPath));
}

function saveUsed(emails) {
  fs.writeFileSync(usedPath, JSON.stringify(emails, null, 2));
}

async function getNextEmail() {
  const used = getUsed();

  let index = used.length + 1;
  let email;
  let attempts = 0;

  do {
    email = baseEmail.replace('@', `+${index}@`);
    index++;
    attempts++;
  } while (used.includes(email) && attempts < 1000);

  if (attempts >= 1000) throw new Error('Ran out of emails');

  return email;
}

async function markEmailUsed(email) {
  const used = getUsed();
  used.push(email);
  saveUsed(used);
}

module.exports = {
  getNextEmail,
  markEmailUsed
};
