const fs = require('fs');
const path = require('path');

const emailPath = path.join(__dirname, '../data/emails.json');
if (!fs.existsSync(emailPath)) fs.writeFileSync(emailPath, JSON.stringify([]));

let pool = JSON.parse(fs.readFileSync(emailPath, 'utf-8'));

function getNextEmail() {
  const unused = pool.find(e => !e.used);
  if (!unused) throw new Error('No unused emails left in pool');
  unused.used = true;
  fs.writeFileSync(emailPath, JSON.stringify(pool, null, 2));
  return unused.email;
}

function resetEmailPool() {
  pool = pool.map(e => ({ ...e, used: false }));
  fs.writeFileSync(emailPath, JSON.stringify(pool, null, 2));
}

module.exports = { getNextEmail, resetEmailPool };
