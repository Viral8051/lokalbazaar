import { useNavigate } from 'react-router-dom'

const tabs = [
  { id: 'home', label: 'Home', emoji: '🏠', path: '/home' },
  { id: 'explore', label: 'Explore', emoji: '🔍', path: '/explore' },
  { id: 'chat', label: 'Messages', emoji: '💬', path: '/chat' },
  { id: 'profile', label: 'Profile', emoji: '👤', path: '/profile' },
]

export default function BottomNav({ active }) {
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-[#0f0a1e] border-t border-white/10 flex z-20">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => navigate(tab.path)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
            active === tab.id ? 'text-[#f5a623]' : 'text-white/40 hover:text-white/70'
          }`}
        >
          <span className="text-xl">{tab.emoji}</span>
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
