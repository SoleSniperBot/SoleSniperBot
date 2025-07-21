const fs = require('fs');
const path = require('path');
const loginNike = require('./loginNike');
const { saveNikeSessionCookies } = require('./sessionManager');

const accountsPath = path.join(__dirname, '../data/accounts.json');

async function loginAll() {
  if (!fs.existsSync(accountsPath)) {
    console.error('❌ accounts.json not found');
    return;
  }

  const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));

  for (const acc of accounts) {
    const { email, password, proxy } = acc;

    try {
      const result = await loginNike(email, password, proxy);

      if (result && result.session) {
        await saveNikeSessionCookies(email, result.session);
        console.log(`💾 Session saved for ${email}`);
      } else {
        console.warn(`⚠️ Login failed for ${email}`);
      }
    } catch (err) {
      console.error(`❌ Error logging in ${email}: ${err.message}`);
    }
  }
}

loginAll();
