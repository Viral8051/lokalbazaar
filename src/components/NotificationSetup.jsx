import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { requestNotificationPermission, onForegroundMessage } from '../lib/firebase'

// In-app toast notification
function Toast({ notification, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-80 bg-[#1a1035] border border-[#f5a623]/30 rounded-2xl p-4 z-50 shadow-xl animate-pulse-once">
      <div className="flex items-start gap-3">
        <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{notification.title}</div>
          <div className="text-xs text-white/60 mt-0.5 line-clamp-2">{notification.body}</div>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white text-lg leading-none flex-shrink-0">✕</button>
      </div>
    </div>
  )
}

export default function NotificationSetup() {
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (!user) return

    // Show notification permission prompt after 10 seconds
    const timer = setTimeout(() => {
      if (Notification.permission === 'default') setShowPrompt(true)
    }, 10000)

    // Listen for foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      setToast({
        title: payload.notification?.title || 'LokalBazaar',
        body: payload.notification?.body || '',
      })
    })

    return () => { clearTimeout(timer); unsubscribe?.() }
  }, [user])

  async function enableNotifications() {
    setShowPrompt(false)
    const token = await requestNotificationPermission()
    if (token && user) {
      // Save FCM token to Supabase
      await supabase.from('profiles').update({ fcm_token: token }).eq('id', user.id)
    }
  }

  return (
    <>
      {/* Foreground toast */}
      {toast && <Toast notification={toast} onClose={() => setToast(null)} />}

      {/* Permission prompt */}
      {showPrompt && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-80 bg-[#1a1035] border border-white/10 rounded-2xl p-4 z-50 shadow-xl">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">🔔</span>
            <div>
              <div className="text-sm font-semibold text-white">Notifications on karo</div>
              <div className="text-xs text-white/50 mt-0.5">Jab koi message kare ya like kare — turant pata chale</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPrompt(false)}
              className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-white/50 hover:text-white transition-colors"
            >
              Baad mein
            </button>
            <button
              onClick={enableNotifications}
              className="flex-1 py-2 rounded-xl bg-[#f5a623] text-white text-xs font-medium hover:bg-[#e09520] transition-colors"
            >
              On karo 🔔
            </button>
          </div>
        </div>
      )}
    </>
  )
}
