const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
const accountsPath = path.join(__dirname, '../data/accounts.json');

// === Helper: Random Name Generator ===
const firstNames = ['Mark', 'Jason', 'Natalie', 'Liam', 'Sophie', 'Daniel', 'Ava', 'Tyler', 'Zara', 'Ethan'];
const lastNames = ['Phillips', 'Taylor', 'Hayes', 'Johnson', 'Reed', 'Murphy', 'Lewis', 'Bennett', 'Foster', 'Wells'];

function getRandomName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return { first, last, full: `${first} ${last}` };
}

function getGmailTrick(base, i) {
  return `${base}+${String(i).padStart(3, '0')}@gmail.com`;
}

function getRandomDOB() {
  const year = Math.floor(Math.random() * (2001 - 1985) + 1985);
  const month = String(Math.floor(Math.random() * 12 + 1)).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28 + 1)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    'Accept-Language': 'en-GB,en;q=0.9',
    'Content-Type': 'application/json'
  };
}

// === Main Generator ===
async function generateNikeAccounts(count, userId) {
  const proxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf8'));
  let accounts = fs.existsSync(accountsPath) ? JSON.parse(fs.readFileSync(accountsPath, 'utf8')) : {};
  if (!accounts[userId]) accounts[userId] = [];

  const generated = [];
  let failed = 0;

  for (let i = 0; i < count; i++) {
    const { first, last, full } = getRandomName();
    const email = getGmailTrick('badmandee1', accounts[userId].length + 1);
    const password = `SolePass#${Math.floor(100 + Math.random() * 900)}`;
    const dob = getRandomDOB();
    const proxy = proxies[i] || null;

    try {
      const body = {
        account: {
          emailAddress: email,
          password: password,
          firstName: first,
          lastName: last,
          dateOfBirth: dob,
          gender: 'male',
          receiveEmail: true
        },
        language: 'en-GB',
        registrationSiteId: 'nike',
        country: 'GB',
        flow: 'signup'
      };

      const res = await fetch('https://unite.nike.com/signup', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
        agent: proxy ? require('socks-proxy-agent').SocksProxyAgent(`socks5://${proxy}`) : undefined
      });

      const json = await res.json();
      if (json.status === 409 || json.error) {
        failed++;
        continue;
      }

      accounts[userId].push({ email, password, proxy });
      generated.push({ email, password });
    } catch (err) {
      console.log(`❌ Failed for ${email}:`, err.message);
      failed++;
    }
  }

  fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
  return { accounts: generated, failed };
}

module.exports = { generateNikeAccounts };
