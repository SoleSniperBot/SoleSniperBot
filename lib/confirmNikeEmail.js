const fs = require('fs');
const path = require('path');

const imapPath = path.join(__dirname, '../data/imap.json');

// ✅ Auto-create imap.json if missing
if (!fs.existsSync(imapPath)) {
  fs.writeFileSync(imapPath, JSON.stringify({}));
}

// ✅ Load IMAP data
const imapData = JSON.parse(fs.readFileSync(imapPath, 'utf-8'));

// 🧠 Continue with the rest of your confirm logic...
// For example:
function getIMAPCredentials(email) {
  const account = imapData.imap_accounts?.find(acc => acc.email === email);
  if (!account) throw new Error('IMAP credentials not found for: ' + email);
  return account;
}

module.exports = {
  getIMAPCredentials
};
