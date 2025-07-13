const fs = require('fs');
const path = require('path');

const usedEmailsPath = path.join(__dirname, '../data/usedEmails.json');

if (!fs.existsSync(usedEmailsPath)) {
  fs.writeFileSync(usedEmailsPath, JSON.stringify([]));
}

function markEmailUsed(email) {
  const current = JSON.parse(fs.readFileSync(usedEmailsPath));
  if (!current.includes(email)) {
    current.push(email);
    fs.writeFileSync(usedEmailsPath, JSON.stringify(current, null, 2));
  }
}

function isEmailUsed(email) {
  const current = JSON.parse(fs.readFileSync(usedEmailsPath));
  return current.includes(email);
}

module.exports = {
  markEmailUsed,
  isEmailUsed,
};
