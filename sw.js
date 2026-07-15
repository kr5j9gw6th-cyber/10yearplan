// ============================================================
// 10年计划 · Service Worker — 离线缓存 & PWA 支持
// ============================================================
const CACHE_NAME = 'ten-year-plan-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
  './sw.js'
];

// 安装：预缓存核心文件
self.addEventListener('install', event => {
  console.log('[SW] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[SW] 部分资源缓存失败（非关键）:', err);
      });
    })
  );
  // 立即激活，不等待旧 SW
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  console.log('[SW] 已激活');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[SW] 清理旧缓存:', key);
          return caches.delete(key);
        })
      );
    })
  );
  // 立即接管所有页面
  self.clients.claim();
});

// 请求：缓存优先 + 后台更新
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // 后台发起网络请求更新缓存
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // 网络失败，若有缓存则已经返回了，这里什么都不做
      });

      // 返回缓存（如果有），否则等网络
      return cached || fetchPromise;
    })
  );
});
