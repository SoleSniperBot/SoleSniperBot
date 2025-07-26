// lib/tlsClientRequest.js
const { execFile } = require('child_process');
const path = require('path');

const TLS_CLIENT_PATH = path.join(__dirname, '../bin/tls-client-api-windows-64-1.11.0.exe'); // Ensure this path is correct

function tlsClientRequest({ url, method = 'GET', headers = {}, body = null, proxy = '' }) {
  return new Promise((resolve, reject) => {
    const args = [
      '--url', url,
      '--method', method,
      '--headers', JSON.stringify(headers),
    ];

    if (body) {
      args.push('--body', typeof body === 'string' ? body : JSON.stringify(body));
    }

    if (proxy) {
      args.push('--proxy', proxy);
    }

    execFile(TLS_CLIENT_PATH, args, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`TLS client failed: ${stderr || error.message}`));
      }

      try {
        const result = JSON.parse(stdout.trim());
        return resolve(result);
      } catch (err) {
        return reject(new Error(`Invalid TLS client response: ${stdout}`));
      }
    });
  });
}

module.exports = { tlsClientRequest };
