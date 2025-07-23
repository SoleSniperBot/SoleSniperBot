const fs = require('fs');
const path = require('path');
require('dotenv').config();

const imapPath = path.join(__dirname, '../data/imap.json');

if (!fs.existsSync(imapPath)) {
  fs.writeFileSync(imapPath, JSON.stringify({ imap_accounts: [] }, null, 2));
}

let imapData;
try {
  imapData = JSON.parse(fs.readFileSync(imapPath, 'utf-8'));
} catch (err) {
  console.warn('⚠️ Failed to parse imap.json. Using env fallback only.');
  imapData = { imap_accounts: [] };
}

function getIMAPCredentials(email) {
  const match = imapData.imap_accounts?.find(acc => acc.email === email);
  if (match) {
    return {
      email: match.email,
      password: match.password,
      proxy: match.proxy || null
    };
  }

  if (process.env.IMAP_EMAIL && process.env.IMAP_PASS) {
    return {
      email: process.env.IMAP_EMAIL,
      password: process.env.IMAP_PASS,
      proxy: process.env.IMAP_PROXY || null
    };
  }

  throw new Error(`❌ IMAP credentials not found for ${email}, and no .env fallback present`);
}

module.exports = { getIMAPCredentials };
