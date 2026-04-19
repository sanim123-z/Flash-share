// sw.js - Service Worker for Web Share Target

const CACHE_NAME = 'flash-share-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // التقاط طلبات المشاركة (Share Target)
    if (event.request.method === 'POST' && event.request.url.includes('/share-target')) {
        event.respondWith((async () => {
            const formData = await event.request.formData();
            const files = formData.getAll('shared_files');
            
            // حفظ الملفات في IndexedDB لكي يقرأها التطبيق الرئيسي
            await saveFilesToDB(files);
            
            // إعادة توجيه المستخدم إلى التطبيق الرئيسي مع إشعار بوجود ملفات
            return Response.redirect('/?shared=true', 303);
        })());
    }
});

// دالة مبسطة لحفظ الملفات في IndexedDB
function saveFilesToDB(files) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ShareTargetDB', 1);
        request.onupgradeneeded = (e) => {
            e.target.result.createObjectStore('files', { autoIncrement: true });
        };
        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('files', 'readwrite');
            const store = tx.objectStore('files');
            // مسح الملفات القديمة
            store.clear();
            files.forEach(file => store.add(file));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject();
        };
    });
}