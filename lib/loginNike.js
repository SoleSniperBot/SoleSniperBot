const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { fetchNike2FACodeAndConfirm } = require('./imap');
const { loginWithBrowserFallback } = require('./puppetLoginFallback');

const sessionsPath = path.join(__dirname, '../data/sessions.json');
if (!fs.existsSync(sessionsPath)) fs.writeFileSync(sessionsPath, JSON.stringify([]));

const tlsClientPath = path.join(__dirname, '../bin/tls-client-api-linux-amd64-1.11.0'); // Make sure this matches your release

async function loginWithBrowser(email, password, proxy = null) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    let proxyObj = proxy;
    if (!proxyObj) proxyObj = await getLockedProxy();
    if (!proxyObj || !proxyObj.formatted) {
      console.error('❌ No valid proxy available for login');
      return { success: false };
    }

    const { formatted, host, port, username, password: pass } = proxyObj;
    const proxyClean = { host, port, username, password: pass };

    const args = [
      '--url', 'https://api.nike.com/identity/authenticate',
      '--method', 'POST',
      '--body', JSON.stringify({
        grant_type: 'password',
        password,
        username: email,
        client_id: 'NKIOS3',
        ux_id: 'com.nike.commerce.snkrs.ios',
        locale: 'en_GB'
      }),
      '--headers', JSON.stringify({
        'Content-Type': 'application/json',
        'User-Agent': 'Nike/93 (iPhone; iOS 16.2; Scale/3.00)',
        'x-nike-ux-id': 'com.nike.commerce.snkrs.ios',
        'Accept-Language': 'en-GB'
      }),
      '--proxy', formatted
    ];

    console.log(`🔐 [Login Attempt ${attempt}] Using proxy ${formatted}`);

    try {
      const output = await runTLSClient(args);
      const res = JSON.parse(output);

      if (res.body && res.body.access_token) {
        const session = {
          email,
          access_token: res.body.access_token,
          proxy: formatted,
          timestamp: new Date().toISOString()
        };

        const all = JSON.parse(fs.readFileSync(sessionsPath));
        all.push(session);
        fs.writeFileSync(sessionsPath, JSON.stringify(all, null, 2));

        console.log(`✅ Logged in via TLS & saved session for ${email}`);
        await releaseLockedProxy(proxyObj);
        return { success: true, session };
      }

      if (res.body && res.body.error === 'verification_required') {
        console.warn(`📨 2FA required for ${email}. Fetching...`);
        const confirmed = await fetchNike2FACodeAndConfirm(email);
        if (confirmed) {
          console.log(`✅ 2FA confirmed for ${email}, retrying login...`);
          continue;
        }
      }

      console.error(`❌ Login failed [TLS]:`, res.body || res);
    } catch (err) {
      console.error(`❌ TLS client error on login [${email}]:`, err.message);
    }

    await releaseLockedProxy(proxyObj);
  }

  console.warn(`⚠️ TLS login failed after 3 attempts. Falling back to Puppeteer...`);
  return await loginWithBrowserFallback(email, password, proxy);
}

function runTLSClient(args) {
  return new Promise((resolve, reject) => {
    execFile(tlsClientPath, args, { timeout: 15000 }, (err, stdout, stderr) => {
      if (err) return reject(err);
      return resolve(stdout.trim());
    });
  });
}

module.exports = { loginWithBrowser };
