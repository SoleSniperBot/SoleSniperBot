const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getLockedProxy, releaseProxy } = require('./proxyManager');
const imapFetchCode = require('./imap'); // assuming your imap.js exports a getNikeCode(email) function
const faker = require('faker'); // Ensure this is installed

const profilePath = path.join(__dirname, '../data/profiles.json');
const emailPath = path.join(__dirname, '../data/emailimap.json'); // Format: [{ email, password, imapHost }]

function loadEmailList() {
  if (fs.existsSync(emailPath)) {
    return JSON.parse(fs.readFileSync(emailPath));
  }
  return [];
}

function generateFakeProfile() {
  const first = faker.name.firstName();
  const last = faker.name.lastName();
  const username = `${first}.${last}${Math.floor(Math.random() * 10000)}`.toLowerCase();
  return {
    first,
    last,
    dob: '1998-04-15',
    gender: 'male',
    email: `${username}@gmail.com`,
    password: 'Sneakerbot!123'
  };
}

async function generateNikeAccount(userId) {
  const emails = loadEmailList();
  if (!emails.length) return { success: false, message: 'â No Gmail IMAP accounts uploaded.' };

  const selectedEmail = emails[Math.floor(Math.random() * emails.length)];
  const proxy = getLockedProxy(userId, selectedEmail.email);
  if (!proxy) return { success: false, message: 'â No proxies available for Nike generation.' };

  const [ip, port, user, pass] = proxy.split(':');
  const proxyConfig = {
    host: ip,
    port: parseInt(port),
    auth: user && pass ? { username: user, password: pass } : undefined,
    protocol: 'http'
  };

  const profile = generateFakeProfile();
  profile.email = selectedEmail.email; // override with real email

  try {
    const res = await axios.post('https://api.nike.com/identity/user', {
      firstName: profile.first,
      lastName: profile.last,
      email: profile.email,
      password: profile.password,
      dateOfBirth: profile.dob,
      gender: profile.gender,
      registrationSiteId: 'nike',
      receiveEmail: true
    }, {
      proxy: proxyConfig,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Nike/93.0.1 (iPhone; iOS 16.6; Scale/3.00)'
      },
      timeout: 15000
    });

    if (res.status === 200 || res.status === 201) {
      // Wait 5s then fetch verification code
      await new Promise(r => setTimeout(r, 5000));
      const code = await imapFetchCode(selectedEmail.email, selectedEmail.password, selectedEmail.imapHost);

      if (!code) return { success: false, message: 'â No verification code found.' };

      // Submit code to Nike
      await axios.post('https://api.nike.com/identity/verify', {
        email: profile.email,
        code: code
      }, {
        proxy: proxyConfig,
        timeout: 10000
      });

      // Save to profiles
      let saved = {};
      if (fs.existsSync(profilePath)) saved = JSON.parse(fs.readFileSync(profilePath));
      if (!saved[userId]) saved[userId] = [];

      saved[userId].push({
        email: profile.email,
        password: profile.password,
        firstName: profile.first,
        lastName: profile.last,
        proxy
      });

      fs.writeFileSync(profilePath, JSON.stringify(saved, null, 2));
      releaseProxy(selectedEmail.email);

      return { success: true, email: profile.email, password: profile.password };
    }

    return { success: false, message: 'â Failed to create Nike account' };

  } catch (err) {
    return { success: false, message: err.message };
  }
}

module.exports = generateNikeAccount;
