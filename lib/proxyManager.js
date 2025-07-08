module.exports.getLockedProxy = async function getLockedProxy() {
  // Your GeoNode credentials
  const username = 'geonode_fUy6U0SwyY';
  const password = '2e3344b4-40ed-4ab8-9299-fdda9d2188a4';
  const ip = 'proxy.geonode.io';
  const port = '9000';

  // Return properly formatted HTTP proxy string
  return {
    ip,
    port,
    username,
    password,
    formatted: `http://${username}:${password}@${ip}:${port}`
  };
};
