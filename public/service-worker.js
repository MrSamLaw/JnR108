const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/db.js",
    "/styles.css",
    "/manifest.webmanifest",
    "/icons/JnR108-512.png"
];

const STATIC_CACHE = "static-cache-v2";
const RUNTIME_CACHE = "runtime-cache";

// Install
self.addEventListener("install", function (evt) {
    evt.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(self.skipWaiting())
    );
});

// Activate
self.addEventListener("activate", function (evt) {
    const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
    evt.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
            })
            .then((cachesToDelete) => {
                return Promise.all(
                    cachesToDelete.map((cacheToDelete) => {
                        return caches.delete(cacheToDelete);
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", evt => {
    // non GET requests are not cached and request to other origins are not cached
    if (
        evt.request.method !== "GET" ||
        !evt.request.url.startsWith(self.location.origin)
    ) {
        evt.respondWith(fetch(evt.request));
        return;
    }

    // Handle runtime GET requests for data from /api routes
    if (evt.request.url.includes("/api/transaction")) {
        // make network request and fallback to cache if network request fails (offline)
        evt.respondWith(
            caches.open(RUNTIME_CACHE).then(cache => {
                return fetch(evt.request)
                    .then(response => {
                        cache.put(evt.request, response.clone());
                        return response;
                    })
                    .catch(() => caches.match(evt.request));
            })
        );
        return;
    }

    // Use cache first for all other requests for performance
    evt.respondWith(
        caches.match(evt.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            // Request is not in cache.  Make network request and cache the response
            return caches.open(RUNTIME_CACHE).then(cache => {
                return fetch(evt.request).then(response => {
                    return cache.put(evt.request, response.clone()).then(() => {
                        return response;
                    });
                });
            });
        })
    );
});