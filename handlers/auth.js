const { vipUsers } = require('../memory/vip');

function isVIP(userId) {
  return vipUsers.has(userId);
}

function addVIP(userId) {
  vipUsers.add(userId);
}

module.exports = { isVIP, addVIP };
