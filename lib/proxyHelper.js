// lib/proxyHelper.js

function parseProxyString(proxyString) {
  try {
    const match = proxyString.match(/^(http|https)?:\/\/(.*?):(.*?)@(.*?):(\d+)/);
    if (!match) return null;

    return {
      protocol: match[1] || 'http',
      username: match[2],
      password: match[3],
      host: match[4],
      port: match[5],
    };
  } catch (e) {
    console.error('❌ Failed to parse proxy string:', proxyString);
    return null;
  }
}

module.exports = { parseProxyString };
