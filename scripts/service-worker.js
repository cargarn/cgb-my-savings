const cachePrefix = `mysavings-app:${new URL(self.registration.scope).pathname}:`;
const cacheName = `${cachePrefix}${APP_VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) =>
        cache.addAll(
          APP_ASSETS.map(
            (asset) => new URL(asset, self.registration.scope).href,
          ),
        ),
      ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(cachePrefix) && name !== cacheName)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(cacheName);
      // Static assets are identical across navigation and module request headers.
      if (event.request.mode === "navigate") {
        const page = await cache.match(
          new URL("index.html", self.registration.scope).href,
          { ignoreVary: true },
        );
        if (page) return page;
      }
      const cached = await cache.match(event.request, { ignoreVary: true });
      return cached ?? fetch(event.request);
    })(),
  );
});
