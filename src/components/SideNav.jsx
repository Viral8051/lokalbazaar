import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const tabs = [
  { id: 'home', label: 'Home', emoji: '🏠', path: '/home' },
  { id: 'explore', label: 'Explore', emoji: '🔍', path: '/explore' },
  { id: 'chat', label: 'Messages', emoji: '💬', path: '/chat' },
  { id: 'profile', label: 'Profile', emoji: '👤', path: '/profile' },
]

export default function SideNav({ active }) {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  return (
    <div className="fixed h-screen w-64 lg:w-72 flex flex-col border-r border-white/10 px-4 py-6 bg-[#0f0a1e]">
      {/* Logo */}
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-[#f5a623]">🛍️ LokalBazaar</h1>
        <p className="text-xs text-white/30 mt-0.5">Apna ghar, apna bazaar</p>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              active === tab.id
                ? 'bg-[#f5a623]/15 text-[#f5a623]'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-lg">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Profile info at bottom */}
      {profile && (
        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#f5a623]/20 border border-[#f5a623]/30 flex items-center justify-center text-[#f5a623] font-bold text-xs flex-shrink-0">
              {profile.shop_name?.slice(0,2).toUpperCase() || 'YO'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{profile.shop_name || 'Your Shop'}</div>
              <div className="text-xs text-white/40 truncate">{profile.plan === 'premium' ? '✦ Premium' : 'Free plan'}</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full text-left px-3 py-2 text-xs text-white/30 hover:text-white/60 transition-colors rounded-lg hover:bg-white/5"
          >
            Logout →
          </button>
        </div>
      )}
    </div>
  )
}
