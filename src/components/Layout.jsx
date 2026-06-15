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
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
      <div
        className="flex flex-shrink-0 border-t pb-safe"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all"
            style={{ color: cur === tab.id ? '#FF4C29' : 'var(--text-hint)' }}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
            {cur === tab.id && (
              <div className="w-1 h-1 rounded-full" style={{ background: '#FF4C29' }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
