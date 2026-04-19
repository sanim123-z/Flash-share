// sw.js - Service Worker for Flash Share PWA
const CACHE_NAME = 'flash-share-v2';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // هذا الكود البسيط ضروري جداً لكي يعترف جوجل كروم بالتطبيق ويظهر زر Install
    if (!event.request.url.startsWith('http')) return;
    
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});