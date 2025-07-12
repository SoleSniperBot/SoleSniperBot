const fs = require('fs');
const path = require('path');
const emailPath = path.join(__dirname, '../data/emails.json');

function loadEmailPool() {
  if (!fs.existsSync(emailPath)) {
    throw new Error('emails.json file not found');
  }
  const raw = fs.readFileSync(emailPath, 'utf-8');
  return JSON.parse(raw);
}

function saveEmailPool(pool) {
  fs.writeFileSync(emailPath, JSON.stringify(pool, null, 2));
}

async function getNextEmail() {
  const pool = loadEmailPool();
  const next = pool.find(e => !e.used);

  if (!next) {
    throw new Error('No unused emails left in pool');
  }

  next.used = true;
  saveEmailPool(pool);

  return next.email;
}

function resetEmailPool() {
  const pool = loadEmailPool().map(e => ({ ...e, used: false }));
  saveEmailPool(pool);
  console.log('♻️ Email pool reset.');
}

module.exports = { getNextEmail, resetEmailPool };
