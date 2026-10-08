const CACHE = "greenflow-shell-v22";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg",
];
const assetURLs = new Set(
  ASSETS.map((path) => new URL(path, self.location).href),
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(
          ASSETS.map((path) => new Request(path, { cache: "reload" })),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("greenflow-shell-") && key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  url.search = "";
  if (request.mode !== "navigate" && !assetURLs.has(url.href)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(url.href);
      try {
        const response = await fetch(request, { cache: "no-store" });
        if (response.ok && assetURLs.has(url.href))
          event.waitUntil(cache.put(url.href, response.clone()));
        return response;
      } catch (error) {
        if (cached) return cached;
        if (request.mode === "navigate") {
          const shell = await cache.match(
            new URL("./index.html", self.location).href,
          );
          if (shell) return shell;
        }
        throw error;
      }
    })(),
  );
});
