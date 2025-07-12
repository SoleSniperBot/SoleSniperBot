// lib/emailManager.js
const fs = require('fs');
const path = require('path');

const emailPath = path.join(__dirname, '../data/emails.json');

async function getNextEmail() {
  if (!fs.existsSync(emailPath)) {
    throw new Error('❌ emails.json not found');
  }

  const data = JSON.parse(fs.readFileSync(emailPath));

  if (!Array.isArray(data.unused) || data.unused.length === 0) {
    throw new Error('❌ No unused emails left!');
  }

  const email = data.unused.shift();
  data.used.push(email);

  fs.writeFileSync(emailPath, JSON.stringify(data, null, 2));
  return email;
}

module.exports = { getNextEmail };
