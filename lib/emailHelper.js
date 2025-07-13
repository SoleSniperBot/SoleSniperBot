// lib/emailHelper.js
const fs = require('fs');
const path = require('path');

const emailPath = path.join(__dirname, '../data/email.json');

function loadEmailPool() {
  const raw = fs.readFileSync(emailPath);
  return JSON.parse(raw);
}

function saveEmailPool(data) {
  fs.writeFileSync(emailPath, JSON.stringify(data, null, 2));
}

function getNextEmail() {
  const data = loadEmailPool();

  const nextEmail = data.pool.find(email => !data.used.includes(email));
  if (!nextEmail) {
    throw new Error('❌ No unused emails left in email pool.');
  }

  data.used.push(nextEmail);
  saveEmailPool(data);

  return nextEmail;
}

function markEmailUsed(email) {
  const data = loadEmailPool();
  if (!data.used.includes(email)) {
    data.used.push(email);
    saveEmailPool(data);
  }
}

module.exports = {
  getNextEmail,
  markEmailUsed,
};
