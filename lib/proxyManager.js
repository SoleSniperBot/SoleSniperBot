require('dotenv').config();

module.exports.getLockedProxy = async function getLockedProxy() {
  const username = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;
  const ip = 'proxy.geonode.io';
  const port = process.env.GEONODE_PORT || '9000';

  return {
    ip,
    port,
    username,
    password,
    formatted: `http://${username}:${password}@${ip}:${port}`
  };
};
