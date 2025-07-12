const fs = require('fs');
const path = require('path');

const emailPath = path.join(__dirname, '../data/emails.json');

function loadEmails() {
  if (!fs.existsSync(emailPath)) {
    fs.writeFileSync(emailPath, JSON.stringify({ unused: [], used: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(emailPath));
}

function saveEmails(data) {
  fs.writeFileSync(emailPath, JSON.stringify(data, null, 2));
}

function getNextEmail() {
  const data = loadEmails();

  if (data.unused.length === 0) {
    console.warn('❌ No unused emails left!');
    return null;
  }

  const email = data.unused.shift();
  data.used.push(email);
  saveEmails(data);
  return email;
}

module.exports = {
  getNextEmail
};
