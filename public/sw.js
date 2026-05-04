// Butiki Service Worker — Cache-First pour assets, Network-First pour data
const CACHE_NAME = 'butiki-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
]

// Installation : pre-cache les assets statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activation : nettoyer les vieux caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch : Stale-While-Revalidate pour HTML, Cache-First pour assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ne pas intercepter les requêtes non-GET ou cross-origin
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) return

  // Strategy: Stale-While-Revalidate (meilleur pour SPA offline)
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      const networkPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            cache.put(request, response.clone())
          }
          return response
        })
        .catch(() => null)

      // Si en cache, retourner immédiatement + revalider en arrière-plan
      if (cached) return cached

      // Sinon attendre le réseau
      const networkResponse = await networkPromise
      if (networkResponse) return networkResponse

      // Fallback offline : retourner index.html pour les pages
      if (request.mode === 'navigate') {
        const fallback = await cache.match('/index.html')
        if (fallback) return fallback
      }

      return new Response('Hors ligne - Contenu non disponible', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      })
    })
  )
})
