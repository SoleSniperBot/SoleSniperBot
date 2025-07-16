/**
 * Helper to parse or validate proxy formats if needed.
 * Extend this with more utilities if needed later.
 */

function parseProxy(proxyString) {
  // Parses http://user:pass@ip:port to { user, pass, ip, port }
  const clean = proxyString.replace(/^http:\/\//, '');
  const parts = clean.split(/[:@]/);

  if (parts.length === 4) {
    const [user, pass, ip, port] = parts;
    return { user, pass, ip, port };
  }

  return null;
}

module.exports = {
  parseProxy,
};
