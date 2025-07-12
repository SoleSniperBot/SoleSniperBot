const fs = require('fs');
const path = require('path');

const emailPath = path.join(__dirname, '../data/emailPool.json');

function loadEmailPool() {
  if (!fs.existsSync(emailPath)) {
    fs.writeFileSync(emailPath, JSON.stringify({ unused: [], used: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(emailPath));
}

function saveEmailPool(data) {
  fs.writeFileSync(emailPath, JSON.stringify(data, null, 2));
}

async function getNextEmail() {
  const data = loadEmailPool();
  if (data.unused.length === 0) {
    throw new Error('No unused emails left in pool');
  }

  const email = data.unused.shift();
  data.used.push(email);
  saveEmailPool(data);
  return email;
}

async function markEmailUsed(email) {
  const data = loadEmailPool();
  if (!data.used.includes(email)) {
    data.used.push(email);
  }
  data.unused = data.unused.filter(e => e !== email);
  saveEmailPool(data);
}

async function addEmails(emails = []) {
  const data = loadEmailPool();
  const clean = emails.filter(e => !data.used.includes(e) && !data.unused.includes(e));
  data.unused.push(...clean);
  saveEmailPool(data);
}

module.exports = {
  getNextEmail,
  markEmailUsed,
  addEmails
};
