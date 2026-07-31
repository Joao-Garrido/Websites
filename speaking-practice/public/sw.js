/*
 * Runtime-caching service worker.
 *
 * Vite emits content-hashed filenames, so instead of a precache manifest this
 * caches same-origin GETs as they are requested and serves them from cache
 * afterwards. That covers the shell, the JS/CSS bundles, the fonts and the
 * topic content — everything the app needs to run without a network.
 *
 * Note: live speech-to-text still needs the network in Chrome and Safari,
 * unless on-device recognition has been installed. Everything else — browsing
 * topics, the question engine, TTS, recording, metrics, history — works offline.
 */

const CACHE = 'falado-v1'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => undefined),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigations: network first, so a deploy is picked up promptly, falling
  // back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          void caches.open(CACHE).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(() =>
          caches.match('/index.html').then((hit) => hit ?? Response.error()),
        ),
    )
    return
  }

  // Assets: cache first — they are content-hashed, so a hit is always correct.
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit
      return fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone()
            void caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => Response.error())
    }),
  )
})
