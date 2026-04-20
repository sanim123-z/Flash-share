// sw.js - Service Worker for Flash Share Pro PWA & Share Target
const CACHE_NAME = 'flash-share-v3';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. التقاط طلبات المشاركة (Web Share Target) القادمة من الهاتف
    if (event.request.method === 'POST' && url.searchParams.has('share-target')) {
        event.respondWith((async () => {
            try {
                const formData = await event.request.formData();
                // نبحث عن الملفات (حسب ما هو محدد في المانيفست)
                const files = formData.getAll('shared_files'); 
                const images = formData.getAll('shared_images'); 
                const allFiles =[...files, ...images];

                // حفظ الملفات في قاعدة بيانات المتصفح
                await saveFilesToDB(allFiles);
                
                // إعادة توجيه المستخدم لفتح التطبيق وتنبيهه بوجود ملفات
                return Response.redirect('./?shared=true', 303);
            } catch (err) {
                console.error('Share Target Error:', err);
                return Response.redirect('./', 303);
            }
        })());
        return; // إنهاء التنفيذ هنا لكي لا يكمل إلى الكاش
    }

    // 2. الكاش الطبيعي لباقي ملفات التطبيق (لضمان عمل PWA)
    if (event.request.url.startsWith('http')) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
    }
});

// دالة لحفظ الملفات المرسلة من نظام الهاتف لتطبيقنا
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
            store.clear(); // مسح أي ملفات قديمة عالقة
            files.forEach(file => {
                if (file instanceof File) store.add(file);
            });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject();
        };
        request.onerror = () => reject();
    });
}