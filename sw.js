/* CLEAR service worker: app shell works offline, data always comes live from Supabase */
const CACHE = "clear-v5";
const SHELL = ["./", "./index.html", "./install.html", "./manifest.json", "./clear-192.png", "./clear-512.png", "./clear-maskable-192.png", "./clear-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  // Only handle our own GET files. Supabase, fonts and uploads go straight to the network.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  // Network first (so updates arrive right away), fall back to cache when offline.
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
