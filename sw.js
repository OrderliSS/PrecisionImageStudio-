const CACHE_NAME = 'precision-studio-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;

    // Check if the request is an HTTP request.
    // Ensure we don't try to cache chrome-extension:// or file:// requests.
    if (!e.request.url.startsWith('http')) return;

    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
