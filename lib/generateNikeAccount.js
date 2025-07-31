const { execFile } = require('child_process');
const path = require('path');

const tlsClientPath = path.resolve(__dirname, '../bin/tls-client');

async function generateNikeAccount() {
  console.log('⚙️ Starting Nike account creation via TLS client...');

  return new Promise((resolve, reject) => {
    execFile(tlsClientPath, [
      '--target', 'https://www.nike.com/gb',
      '--method', 'POST',
      '--body', JSON.stringify({
        email: `auto_${Date.now()}@gmail.com`,
        password: 'Password123!',
        firstName: 'Mark',
        lastName: 'Phillips',
        country: 'GB',
        locale: 'en_GB'
      }),
      '--headers', JSON.stringify({
        'content-type': 'application/json',
        'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)'
      })
    ], (error, stdout, stderr) => {
      if (error) {
        console.error('❌ TLS client error:', error.message);
        return reject(error);
      }
      console.log('✅ Account creation response:', stdout);
      resolve(stdout);
    });
  });
}

module.exports = generateNikeAccount;
