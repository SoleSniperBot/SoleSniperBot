const fs = require('fs');
const path = require('path');

// In-memory set of used proxies
const lockedProxies = new Set();

// === Function to get 25 unique, unlocked proxies ===
function getUserProxies(count = 25) {
  const filePath = path.join(__dirname, '../data/proxies.json');

  if (!fs.existsSync(filePath)) return [];

  const allProxies = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const available = allProxies.filter(p => !lockedProxies.has(p));

  if (available.length < count) return []; // Not enough free proxies

  // Randomly select `count` proxies
  const selected = [];
  while (selected.length < count) {
    const rand = available[Math.floor(Math.random() * available.length)];
    if (!selected.includes(rand)) {
      selected.push(rand);
      lockedProxies.add(rand); // Mark as used
    }
  }

  return selected;
}

// === Function to release all proxies for a user ===
function releaseUserProxies(proxies = []) {
  proxies.forEach(proxy => lockedProxies.delete(proxy));
}

// Export functions
module.exports.getUserProxies = getUserProxies;
module.exports.releaseUserProxies = releaseUserProxies;
