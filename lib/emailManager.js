const fs = require('fs');
const path = require('path');

const EMAIL_POOL_PATH = path.join(__dirname, '../data/email.json');
const USED_EMAILS_PATH = path.join(__dirname, '../data/usedEmails.json');

if (!fs.existsSync(EMAIL_POOL_PATH)) fs.writeFileSync(EMAIL_POOL_PATH, JSON.stringify([]));
if (!fs.existsSync(USED_EMAILS_PATH)) fs.writeFileSync(USED_EMAILS_PATH, JSON.stringify([]));

const BASE = 'botsolesniper';
const DOMAIN = '@gmail.com';
const POOL_THRESHOLD = 50; // If pool drops below this, auto-generate more
const BATCH_SIZE = 250;

function getEmailPool() {
  return JSON.parse(fs.readFileSync(EMAIL_POOL_PATH));
}

function getUsedEmails() {
  return new Set(JSON.parse(fs.readFileSync(USED_EMAILS_PATH)));
}

function saveEmailPool(pool) {
  fs.writeFileSync(EMAIL_POOL_PATH, JSON.stringify(pool, null, 2));
}

function saveUsedEmails(used) {
  fs.writeFileSync(USED_EMAILS_PATH, JSON.stringify([...used], null, 2));
}

function generateEmails(startIndex, count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const num = String(startIndex + i).padStart(6, '0');
    list.push(`${BASE}+${num}${DOMAIN}`);
  }
  return list;
}

function ensurePoolIsFull() {
  const pool = getEmailPool();
  const used = getUsedEmails();
  const available = pool.filter(email => !used.has(email));

  if (available.length >= POOL_THRESHOLD) return;

  const lastUsed = Math.max(
    0,
    ...[...pool, ...used].map(email => {
      const match = email.match(/\+(\d+)\@/);
      return match ? parseInt(match[1], 10) : 0;
    })
  );

  const newEmails = generateEmails(lastUsed + 1, BATCH_SIZE);
  const updatedPool = [...pool, ...newEmails];
  saveEmailPool(updatedPool);
  console.log(`📩 Generated ${BATCH_SIZE} new emails. Pool now at ${updatedPool.length}`);
}

function getNextEmail() {
  ensurePoolIsFull();
  const pool = getEmailPool();
  const used = getUsedEmails();

  const available = pool.find(email => !used.has(email));
  if (!available) throw new Error('🚫 No available emails.');

  used.add(available);
  saveUsedEmails(used);
  return available;
}

function markEmailUsed(email) {
  const used = getUsedEmails();
  if (!used.has(email)) {
    used.add(email);
    saveUsedEmails(used);
  }
}

module.exports = {
  getNextEmail,
  markEmailUsed,
  ensurePoolIsFull,
};
