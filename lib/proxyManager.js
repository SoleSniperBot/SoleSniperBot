const fs = require('fs');
const path = require('path');

const proxyFile = path.join(__dirname, '../data/socks5_proxies.json');
let rawProxies = JSON.parse(fs.readFileSync(proxyFile, 'utf-8'));

const formattedProxies = rawProxies.map((line) => {
  const [host, port, username, password] = line.split(':');
  return {
    host,
    port: parseInt(port),
    username,
    password,
    formatted: `socks5://${username}:${password}@${host}:${port}`
  };
});

module.exports = {
  getAllProxies: () => formattedProxies,
  getRandomProxy: () => formattedProxies[Math.floor(Math.random() * formattedProxies.length)]
};
