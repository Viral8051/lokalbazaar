import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

// 👇 Replace with your Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

// Request permission + get FCM token
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    })
    return token
  } catch (err) {
    console.error('FCM token error:', err)
    return null
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback) {
  return onMessage(messaging, callback)
}

export { messaging }
