importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// Same config as firebase.js
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || '',
  authDomain: self.FIREBASE_AUTH_DOMAIN || '',
  projectId: self.FIREBASE_PROJECT_ID || '',
  storageBucket: self.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: self.FIREBASE_APP_ID || '',
})

const messaging = firebase.messaging()

// Background message handler
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {}
  self.registration.showNotification(title || 'LokalBazaar', {
    body: body || 'Koi naya update hai!',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data,
    actions: [
      { action: 'open', title: 'Dekho' },
      { action: 'close', title: 'Baad mein' },
    ]
  })
})

// Notification click handler
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  if (e.action === 'open' || !e.action) {
    const url = e.notification.data?.url || '/'
    e.waitUntil(clients.openWindow(url))
  }
})
