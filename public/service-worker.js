const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/db.js",
    "/styles.css",
    "/manifest.webmanifest",
    "/icons/JnR108-512.png",
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// Install
self.addEventListener("install", function (evt) {
    evt.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(self.skipWaiting())
    );
});

// Activate
self.addEventListener("activate", function (evt) {
    const currentCaches = [CACHE_NAME, DATA_CACHE_NAME];
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