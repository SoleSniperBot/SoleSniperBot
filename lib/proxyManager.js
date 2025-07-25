const fs = require("fs");
const path = require("path");

const proxyPath = path.join(__dirname, "../data/socks5_proxies.json");
let proxies = [];
let locked = {};

function loadProxies() {
  if (!fs.existsSync(proxyPath)) return;
  const raw = fs.readFileSync(proxyPath, "utf-8");
  proxies = JSON.parse(raw);
  console.log(`🔁 Loaded ${proxies.length} proxies`);
}

function getLockedProxy() {
  loadProxies();

  const available = proxies.filter(p => !locked[p]);
  if (available.length === 0) {
    throw new Error("⚠️ No proxies available.");
  }

  const proxy = available[Math.floor(Math.random() * available.length)];
  locked[proxy] = true;
  return proxy;
}

function releaseLockedProxy(proxy) {
  if (locked[proxy]) {
    delete locked[proxy];
    console.log("🔓 Released proxy:", proxy);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
