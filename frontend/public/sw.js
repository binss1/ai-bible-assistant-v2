// AI Bible Assistant Service Worker
const CACHE_NAME = 'bible-assistant-v1';

// 기본적으로 캐시할 URL들 (존재가 확실한 것만)
const urlsToCache = [
  '/',
  '/manifest.json'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache opened');
        // 각 URL을 개별적으로 캐시하여 오류 방지
        return Promise.allSettled(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`Service Worker: Failed to cache ${url}:`, err);
              return null;
            });
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Installation completed');
        // 새 버전 즉시 활성화
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed:', error);
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation completed');
      // 모든 클라이언트에서 즉시 제어권 가져오기
      return self.clients.claim();
    })
  );
});

// fetch 이벤트 - 네트워크 우선 전략 (최신 컨텐츠 우선)
self.addEventListener('fetch', (event) => {
  // GET 요청만 처리
  if (event.request.method !== 'GET') {
    return;
  }

  // API 요청은 캐시하지 않음
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 네트워크 응답이 성공하면 캐시에 저장하고 반환
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 반환
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Service Worker: Serving from cache:', event.request.url);
            return cachedResponse;
          }
          
          // HTML 요청이고 캐시에 없으면 메인 페이지 반환 (SPA 라우팅 지원)
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
          
          return new Response('네트워크 오류: 리소스를 불러올 수 없습니다.', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// 메시지 이벤트 (업데이트 알림 등)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 백그라운드 동기화 (향후 오프라인 메시지 전송용)
self.addEventListener('sync', (event) => {
  if (event.tag === 'bible-message-sync') {
    event.waitUntil(syncBibleMessages());
  }
});

// 백그라운드 동기화 함수
async function syncBibleMessages() {
  try {
    // 로컬에 저장된 미전송 메시지들을 서버로 전송
    // 향후 구현 예정
    console.log('Service Worker: Background sync completed');
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// 푸시 알림 (향후 기능)
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/android-chrome-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1'
      },
      actions: [
        {
          action: 'explore',
          title: '확인',
          icon: '/checkmark.png'
        },
        {
          action: 'close',
          title: '닫기',
          icon: '/xmark.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification('AI Bible Assistant', options)
    );
  }
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
