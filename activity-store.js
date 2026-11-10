/* Browser-local history. A saved result is never refreshed from the Activity page. */
const SpendWiseActivity = (() => {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const MAX_ENTRIES = 50;

  function storageKey() {
    let email = "local";
    try {
      const account = JSON.parse(localStorage.getItem("spendwise_account"));
      if (typeof account?.email === "string" && account.email.trim()) email = account.email.trim().toLowerCase();
    } catch { /* Use the local profile. */ }
    return `spendwise_activity_v1:${email}`;
  }

  function list() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey()));
      if (!Array.isArray(value)) return [];
      let removedExpiredResult = false;
      const entries = value.filter((item) => item && typeof item.id === "string"
        && typeof item.product === "string" && typeof item.createdAt === "number")
        .map((item) => {
          if (!isExpired(item) || item.result === null) return item;
          removedExpiredResult = true;
          return { ...item, result: null };
        });
      if (removedExpiredResult) localStorage.setItem(storageKey(), JSON.stringify(entries));
      return entries;
    } catch { return []; }
  }

  function save(entries) {
    try {
      const compact = entries.slice(0, MAX_ENTRIES).map((item) => isExpired(item)
        ? { ...item, result: null } : item);
      localStorage.setItem(storageKey(), JSON.stringify(compact));
      return true;
    } catch { return false; }
  }

  function isExpired(item) {
    return !Number.isFinite(item?.createdAt) || Date.now() >= item.createdAt + WEEK_MS;
  }

  function get(id) {
    return list().find((item) => item.id === id) || null;
  }

  function start(product, country) {
    const id = typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const entry = { id, product, country, createdAt: Date.now(), status: "pending", result: null };
    save([entry, ...list()]);
    return id;
  }

  function update(id, status, result = null) {
    if (!id) return false;
    const entries = list();
    const index = entries.findIndex((item) => item.id === id);
    if (index < 0 || isExpired(entries[index])) return false;
    entries[index] = { ...entries[index], status, result };
    return save(entries);
  }

  return { list, get, start, update, isExpired };
})();
