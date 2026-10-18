const CACHE_NAME = "spendwise-shell-v1";
const APP_FILES = [
  "./",
  "./index.html",
  "./signup.html",
  "./profile-onboarding.html",
  "./profile.html",
  "./home.html",
  "./analysis.html",
  "./how-it-works.html",
  "./styles.css",
  "./auth.js",
  "./onboarding.js",
  "./profile.js",
  "./home.js",
  "./analysis.js",
  "./tutorial.js",
  "./manifest.webmanifest",
  "./apple-touch-icon.png",
  "./icons/spendwise-192.png",
  "./icons/spendwise-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const requests = APP_FILES.map((path) => new Request(new URL(path, self.registration.scope)));
    await cache.addAll(requests);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.filter((name) => name.startsWith("spendwise-shell-") && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;
      if (request.mode === "navigate") {
        return caches.match(new URL("./index.html", self.registration.scope).href);
      }
      return new Response("You are offline and this page is not saved yet.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  })());
});
