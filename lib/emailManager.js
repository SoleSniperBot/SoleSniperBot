// lib/emailManager.js
const fs = require('fs');
const path = require('path');

const poolPath = path.join(__dirname, '../data/emailPool.json');
const usedPath = path.join(__dirname, '../data/usedEmails.json');

const BASE = 'botsolesniper@gmail.com';

function loadJson(p) {
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : [];
}

function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function generateAliases(count, existing) {
  const aliases = new Set();
  let i = 0;
  while (aliases.size < count) {
    const alias = `${BASE.split('@')[0]}+${Date.now()}_${i}@gmail.com`;
    if (!existing.includes(alias)) aliases.add(alias);
    i++;
  }
  return Array.from(aliases);
}

function replenishPoolIfNeeded(threshold = 500, topup = 2000) {
  const pool = loadJson(poolPath);
  const used = loadJson(usedPath);
  const existing = [...pool, ...used];

  if (pool.length < threshold) {
    const newAliases = generateAliases(topup, existing);
    saveJson(poolPath, [...pool, ...newAliases]);
    console.log(`⚡ Email pool topped up with ${newAliases.length} new aliases`);
  }
}

function getNextEmail() {
  replenishPoolIfNeeded(); // Check before fetch

  const pool = loadJson(poolPath);
  const used = loadJson(usedPath);

  if (!pool.length) throw new Error('❌ No available emails in pool!');

  const email = pool.shift();
  used.push(email);

  saveJson(poolPath, pool);
  saveJson(usedPath, used);
  return email;
}

module.exports = { getNextEmail, replenishPoolIfNeeded };
