/**
 * GrubDash Service Worker
 * 
 * Implements a production-grade caching strategy for a food delivery app:
 * - Cache static assets (JS, CSS, images, fonts)
 * - Network-first for API requests (fresh data priority)
 * - Offline fallback for critical pages
 * - Skip waiting on update (controlled by update manager)
 */

const CACHE_VERSION = 'grubdash-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
    '/',
    '/offline',
    '/manifest.json',
];

// Routes that should work offline
const OFFLINE_PAGES = [
    '/',
    '/offline',
];

// API endpoints (use network-first)
const API_ROUTES = [
    '/api/',
    'https://grub-dash-api.vercel.app/api/',
];

// Static asset patterns (cache-first)
const STATIC_ASSET_PATTERNS = [
    /\.(?:js|css|woff2?|ttf|otf|eot)$/,
    /_next\/static\//,
];

// Image patterns (cache-first with expiration)
const IMAGE_PATTERNS = [
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
    /res\.cloudinary\.com/,
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Precaching assets');
            return cache.addAll(PRECACHE_ASSETS);
        })
    );

    // Activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => {
                        // Delete old caches
                        return cacheName.startsWith('grubdash-') && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== IMAGE_CACHE;
                    })
                    .map((cacheName) => {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        })
    );

    // Take control of all pages immediately
    return self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome extensions
    if (url.protocol === 'chrome-extension:') {
        return;
    }

    // Strategy 1: Network-first for API requests (fresh data priority)
    if (isAPIRequest(url)) {
        event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
        return;
    }

    // Strategy 2: Cache-first for images (performance)
    if (isImageRequest(url)) {
        event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE, 30 * 24 * 60 * 60 * 1000)); // 30 days
        return;
    }

    // Strategy 3: Cache-first for static assets (JS, CSS, fonts)
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
        return;
    }

    // Strategy 4: Network-first for HTML pages (fresh content)
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
        return;
    }

    // Default: Network-first
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// Listen for skip waiting message from update manager
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Received SKIP_WAITING message');
        self.skipWaiting();
    }
});

// Helper: Check if request is an API call
function isAPIRequest(url) {
    return API_ROUTES.some(route => url.href.includes(route));
}

// Helper: Check if request is for an image
function isImageRequest(url) {
    return IMAGE_PATTERNS.some(pattern => pattern.test(url.href));
}

// Helper: Check if request is for a static asset
function isStaticAsset(url) {
    return STATIC_ASSET_PATTERNS.some(pattern => pattern.test(url.href));
}

// Strategy: Network-first (for dynamic content and API)
async function networkFirstStrategy(request, cacheName) {
    try {
        // Try network first
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        console.log('[SW] Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // If HTML request and offline, return offline page
        if (request.headers.get('accept')?.includes('text/html')) {
            const offlinePage = await caches.match('/offline');
            if (offlinePage) {
                return offlinePage;
            }
        }

        // Return error
        return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}

// Strategy: Cache-first (for static assets and images)
async function cacheFirstStrategy(request, cacheName, maxAge = null) {
    // Try cache first
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // Check if cache is expired (if maxAge is set)
        if (maxAge) {
            const cachedDate = new Date(cachedResponse.headers.get('date'));
            const now = new Date();
            const age = now - cachedDate;

            if (age > maxAge) {
                // Cache expired, fetch new version in background
                fetchAndCache(request, cacheName);
            }
        }

        return cachedResponse;
    }

    // Not in cache, fetch from network
    try {
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Failed to fetch:', request.url);
        return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}

// Helper: Fetch and cache in background
async function fetchAndCache(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, response);
        }
    } catch (error) {
        console.log('[SW] Background fetch failed:', request.url);
    }
}

// --- Push Notification Handlers ---

/**
 * Handle incoming push messages
 */
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);

    let data = {
        title: 'New Notification',
        body: 'You have a new update from GrubDash!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'grubdash-update',
        url: '/',
        actions: []
    };

    if (event.data) {
        try {
            const pushData = event.data.json();
            data = { ...data, ...pushData };

            // If the payload has a nested data object with a url, prioritize it
            if (pushData.data && pushData.data.url) {
                data.url = pushData.data.url;
            }
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        vibrate: [200, 100, 200],
        data: {
            url: data.url,
        },
        actions: data.actions || [
            { action: 'view_order', title: 'View Order' },
            { action: 'close', title: 'Close' }
        ],
        renotify: true, // Replace old notification with same tag
        requireInteraction: true // Keep on screen until user interacts
    };

    event.waitUntil(
        Promise.all([
            self.registration.showNotification(data.title, options),
            // Send message to all clients (foreground windows)
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                windowClients.forEach((client) => {
                    client.postMessage({
                        type: 'PUSH_NOTIFICATION',
                        payload: {
                            title: data.title,
                            body: data.body,
                            url: data.url
                        }
                    });
                });
            })
        ])
    );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click received:', event);
    const notification = event.notification;
    const action = event.action;

    notification.close();

    if (action === 'close') {
        return;
    }

    // Default or 'view_order' action
    const urlToOpen = notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If a window is already open, focus it and navigate
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
