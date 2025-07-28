// lib/fetchGeoProxies.js
const fs = require('fs');
const path = require('path');

const proxyFilePath = path.join(__dirname, '../data/socks5_proxies.json');

// ✅ Replace this list with your own generated list of sticky proxies
const staticProxies = [
  "http://geonode_fUy6U0SwyY-type-residential-country-gb-lifetime-60-session-5zgrMl:de9d3498-2b19-429e-922b-8f2a24eeb83c@proxy.geonode.io:10000",
  "http://geonode_fUy6U0SwyY-type-residential-country-gb-lifetime-60-session-24EYde:de9d3498-2b19-429e-922b-8f2a24eeb83c@proxy.geonode.io:10000",
  "http://geonode_fUy6U0SwyY-type-residential-country-gb-lifetime-60-session-SIHrHc:de9d3498-2b19-429e-922b-8f2a24eeb83c@proxy.geonode.io:10000",
  // ...
  "http://geonode_fUy6U0SwyY-type-residential-country-gb-lifetime-60-session-31172L:de9d3498-2b19-429e-922b-8f2a24eeb83c@proxy.geonode.io:10000"
];

fs.writeFileSync(proxyFilePath, JSON.stringify(staticProxies, null, 2));
console.log(`✅ Saved ${staticProxies.length} HTTP proxies to socks5_proxies.json`);
