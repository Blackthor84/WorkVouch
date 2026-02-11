/* WorkVouch PWA Service Worker - cache-first for static assets */
const CACHE_NAME = "workvouch-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            try {
              cache.put(request, response.clone());
            } catch (_) {}
          }
          return response;
        });
      });
    })
  );
});
