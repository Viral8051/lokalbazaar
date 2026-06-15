import { useNavigate, useLocation } from 'react-router-dom'

export default function Layout({ children, active }) {
  const navigate = useNavigate()
  const location = useLocation()
  const cur = active || location.pathname.split('/')[1] || 'home'

  const tabs = [
    { id: 'home',    label: 'Home',    icon: '🏠', path: '/home' },
    { id: 'explore', label: 'Explore', icon: '🔍', path: '/explore' },
    { id: 'chat',    label: 'Chat',    icon: '💬', path: '/chat' },
    { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' },
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',         /* dynamic viewport height — mobile safe */
      overflow: 'hidden',
      background: 'var(--bg)',
      maxWidth: 480,            /* mobile-first max width */
      margin: '0 auto',
      position: 'relative',
    }}>
      {/* Page content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {children}
      </div>

      {/* Bottom nav */}
      <div style={{
        display: 'flex',
        flexShrink: 0,
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '10px 4px 8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: cur === tab.id ? '#FF4C29' : 'var(--text-hint)',
              transition: 'color 0.2s',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{tab.label}</span>
            {cur === tab.id && (
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#FF4C29' }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
