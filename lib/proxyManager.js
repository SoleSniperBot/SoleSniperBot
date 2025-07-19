async function getLockedProxy() {
  const all = getAllProxies();
  const locked = getLocked();

  for (const proxy of all) {
    const rawProxy = proxy.formatted;

    if (!locked.includes(rawProxy)) {
      locked.push(rawProxy);
      saveLocked(locked);

      return {
        ...proxy,
        formatted: rawProxy // ← don't substitute anymore
      };
    }
  }

  return null;
}
