const fs = require('fs');
const path = require('path');

const usedPath = path.join(__dirname, '../data/usedEmails.json');

// Ensure file exists
if (!fs.existsSync(usedPath)) {
  fs.writeFileSync(usedPath, JSON.stringify([]));
}

// ✅ Exported function to mark emails
function markEmailUsed(email) {
  const list = JSON.parse(fs.readFileSync(usedPath));
  list.push(email);
  fs.writeFileSync(usedPath, JSON.stringify(list, null, 2));
}

module.exports = { markEmailUsed };
