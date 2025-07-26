const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { loginWithBrowser } = require('./loginNike');
const { fetchNike2FACodeAndConfirm } = require('./imap');
const { generateNikeEmail, generatePassword, generateRandomName, generateRandomDOB } = require('./utils');

const accountsPath = path.join(__dirname, '../data/created_accounts.json');
const tlsClientPath = path.join(__dirname, '../tls-client');
if (!fs.existsSync(accountsPath)) fs.writeFileSync(accountsPath, JSON.stringify([]));

module.exports = async function generateNikeAccount(user = 'system') {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const proxy = await getLockedProxy();
    if (!proxy) return null;

    const { host, port, username, password } = proxy;
    const formatted = `socks5://${username}:${password}@${host}:${port}`;
    const email = generateNikeEmail();
    const passwordVal = generatePassword();
    const { firstName, lastName } = generateRandomName();
    const dob = generateRandomDOB();
    const timestamp = new Date().toISOString();

    const payload = {
      email,
      password: passwordVal,
      firstName,
      lastName,
      dateOfBirth: dob,
      country: 'GB',
      locale: 'en-GB',
      receiveEmail: true
    };

    const args = [
      '--method', 'POST',
      '--url', 'https://api.nike.com/identity/user/create',
      '--body', JSON.stringify(payload),
      '--headers', JSON.stringify({
        'Content-Type': 'application/json',
        'User-Agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
        'Accept': '*/*',
        'Connection': 'keep-alive'
      }),
      '--proxy', formatted
    ];

    const accountData = { email, password: passwordVal, firstName, lastName, dob, proxy: formatted, timestamp };

    try {
      const stdout = await new Promise((resolve, reject) => {
        execFile(tlsClientPath, args, (err, stdout, stderr) => {
          if (err) return reject(err);
          resolve(stdout);
        });
      });

      const response = JSON.parse(stdout.toString());
      if (!response.body || response.status !== 200) throw new Error('Nike creation failed');

      await fetchNike2FACodeAndConfirm(email);
      const login = await loginWithBrowser(email, passwordVal, proxy);
      if (!login.success) console.warn('⚠️ Login failed after creation');

      const all = JSON.parse(fs.readFileSync(accountsPath));
      all.push(accountData);
      fs.writeFileSync(accountsPath, JSON.stringify(all, null, 2));
      await releaseLockedProxy(proxy);
      return accountData;
    } catch (e) {
      console.error(`❌ [Attempt ${attempt}] ${e.message}`);
      await releaseLockedProxy(proxy);
    }
  }
  return null;
};
