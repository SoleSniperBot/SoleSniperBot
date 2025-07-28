const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const TLS_CLIENT_PATH = path.resolve(__dirname, '../bin/tls-client');

function tlsClientRequest({ url, method = 'GET', headers = {}, body = null, proxy = '' }) {
  return new Promise((resolve, reject) => {
    // ✅ Check that the binary exists before executing
    if (!fs.existsSync(TLS_CLIENT_PATH)) {
      return reject(new Error(`❌ TLS binary not found at ${TLS_CLIENT_PATH}`));
    }

    const args = [
      '--url', url,
      '--method', method,
      '--headers', JSON.stringify(headers),
    ];

    if (body) args.push('--body', typeof body === 'string' ? body : JSON.stringify(body));
    if (proxy) args.push('--proxy', proxy);

    execFile(TLS_CLIENT_PATH, args, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ TLS exec error:', stderr || error.message); // ✅ Improvement 1
        return reject(new Error(`TLS client failed: ${stderr || error.message}`));
      }

      try {
        const result = JSON.parse(stdout.trim());
        return resolve(result);
      } catch (err) {
        console.error('❌ Failed to parse TLS response:', stdout); // ✅ Optional debug
        return reject(new Error(`Invalid TLS client response: ${stdout}`));
      }
    });
  });
}

module.exports = { tlsClientRequest };
