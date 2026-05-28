// EquiPredict Service Worker — Push Notifications

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('eq-sw', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('meta')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getLastActive() {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('meta', 'readonly')
      const req = tx.objectStore('meta').get('lastActive')
      req.onsuccess = () => resolve(req.result ?? 0)
      req.onerror = () => resolve(0)
    })
  } catch { return 0 }
}

async function setLastActive(ts) {
  try {
    const db = await openDB()
    const tx = db.transaction('meta', 'readwrite')
    tx.objectStore('meta').put(ts, 'lastActive')
  } catch {}
}

// Mise à jour du timestamp "dernière activité" depuis la page
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PING') {
    setLastActive(Date.now())
  }
})

self.addEventListener('push', (event) => {
  event.waitUntil(handlePush(event))
})

async function handlePush(event) {
  const data = event.data?.json() ?? {}

  // Ne pas notifier si l'app n'a pas été ouverte récemment (> 4h = app fermée)
  const lastActive = await getLastActive()
  const threshold = Date.now() - 4 * 60 * 60 * 1000
  if (lastActive < threshold) return

  // Si l'app est au premier plan, envoyer un message interne plutôt qu'une notif OS
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  const foreground = clients.find(c => c.visibilityState === 'visible')
  if (foreground) {
    foreground.postMessage({ type: 'RACE_ALERT', ...data })
    return
  }

  // Notification système (arrière-plan / écran verrouillé)
  await self.registration.showNotification(data.title ?? 'EquiPredict', {
    body: data.body ?? 'Une course favorite démarre dans 5 minutes',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: data.raceId ?? 'eq-race',
    data: { url: data.url ?? '/dashboard-premium?type=favoris' },
    requireInteraction: false,
    silent: false,
  })
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/dashboard-premium?type=favoris'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes('equipredict'))
      if (existing) { existing.focus(); return existing.navigate(url) }
      return self.clients.openWindow(url)
    })
  )
})

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
