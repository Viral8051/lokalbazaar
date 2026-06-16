import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import { House, Search, MessageCircle, User, BarChart2 } from 'lucide-react';

export default function Layout({ children, active }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuth()
  const cur = active || location.pathname.split('/')[1] || 'home'

  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  const displayName = profile?.role === 'buyer' ? profile?.owner_name : profile?.shop_name

  const tabs = [
    { id: 'home',      label: 'Home',      icon: House, path: '/home' },
    { id: 'explore',   label: 'Explore',   icon: Search, path: '/explore' },
    { id: 'chat',      label: 'Chat',      icon: MessageCircle, path: '/chat' },
    { id: 'analytics', label: 'Analytics', icon: BarChart2, path: '/analytics', sellerOnly: true },
    { id: 'profile',   label: 'Profile',   icon: User, path: '/profile' },
  ]

  const visibleTabs = tabs.filter(t => !t.sellerOnly || profile?.role === 'seller')

  return (
    <>
      {/* ── DESKTOP layout (md+) ── */}
      <div style={{
        display: 'none',
        height: '100dvh',
        background: 'var(--bg)',
      }} className="md-layout">

        {/* Left Sidebar */}
        <aside style={{
          width: 220,
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
              <span style={{ color: 'var(--text)' }}>Lokal</span>
              <span style={{ color: '#FF4C29' }}>Bazaar</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 3 }}>
              📍 {profile?.city || 'Jamnagar'}
            </div>
          </div>

          {/* Nav items */}
          <nav style={{ padding: '10px 8px', flex: 1 }}>
            {visibleTabs.map(tab => {
               const Icon = tab.icon
              return(
              <button key={tab.id} onClick={() => navigate(tab.path)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '11px 14px', marginBottom: 2,
                borderRadius: 12, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: cur === tab.id ? 700 : 500,
                background: cur === tab.id ? 'rgba(255,76,41,0.1)' : 'transparent',
                color: cur === tab.id ? '#FF4C29' : 'var(--text-sub)',
                transition: 'all 0.15s',
              }}>
                <Icon size={18}/>
                {tab.label}
              </button>
            )})}
          </nav>

          {/* Bottom — profile + theme */}
          <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
            
            <button onClick={() => navigate('/profile')} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 10px',
              borderRadius: 12, border: '1px solid var(--border)',
              background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: 'var(--bg-surf)', border: '2px solid #FF4C29',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#FF4C29',
              }}>
                {initials(displayName)}
              </div>
              <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName || 'Profile'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-hint)' }}>
                  {profile?.role === 'buyer' ? '🛒 Buyer' : '🏪 Seller'}
                </div>
              </div>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {children}
        </main>

        {/* Right panel — Nearby sellers */}
        <aside style={{
          width: 'clamp(180px, 20vw, 240px)',
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border)',
          padding: '20px 16px',
          overflowY: 'auto',
          flexShrink: 0,
        }} className="scrollbar-hide">
          <RightPanel navigate={navigate} profile={profile} />
        </aside>
      </div>

      {/* ── MOBILE layout (<md) ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'var(--bg)',
        overflow: 'hidden',
      }} className="mobile-layout">
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
          {visibleTabs.filter(t => t.id !== 'analytics').map(tab => {
  const Icon = tab.icon  // ← yeh add karo
  return (
    <button key={tab.id} onClick={() => navigate(tab.path)} style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 3, padding: '10px 4px 8px',
      background: 'transparent', border: 'none', cursor: 'pointer',
      color: cur === tab.id ? '#FF4C29' : 'var(--text-hint)',
      fontFamily: 'inherit', transition: 'color 0.2s',
    }}>
      <Icon size={20} />  {/* ← span hata ke Icon component */}
      <span style={{ fontSize: 10, fontWeight: 600 }}>{tab.label}</span>
      {cur === tab.id && (
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#FF4C29' }} />
      )}
    </button>
  )
})}
        </div>
      </div>

      {/* ── Responsive CSS ── */}
      <style>{`
        @media (min-width: 768px) {
          .md-layout { display: flex !important; }
          .mobile-layout { display: none !important; }
        }
      `}</style>
    </>
  )
}

// Right panel component
function RightPanel({ navigate, profile }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
        Nearby Sellers
      </div>
      <NearbySellersList navigate={navigate} />

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Categories
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { emoji: '🥻', label: 'Saree' },
            { emoji: '🍬', label: 'Mithai' },
            { emoji: '💍', label: 'Jewellery' },
            { emoji: '🏺', label: 'Handicraft' },
            { emoji: '🍱', label: 'Food' },
            { emoji: '🧴', label: 'Beauty' },
            { emoji: '👗', label: 'Clothing' },
          ].map(c => (
            <button key={c.label} onClick={() => navigate('/explore')} style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 8,
              background: 'var(--bg-surf)', color: 'var(--text-sub)',
              border: '1px solid var(--border)', cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Lazy load sellers for right panel
function NearbySellersList({ navigate }) {
  const [sellers, setSellers] = React.useState([])
  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  React.useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      supabase.from('profiles').select('id, shop_name, city, post_count')
        .eq('is_seller', true)
        .order('follower_count', { ascending: false })
        .limit(6)
        .then(({ data }) => setSellers(data || []))
    })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {sellers.map(s => (
        <button key={s.id} onClick={() => navigate(`/seller/${s.id}`)} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 12,
          background: 'var(--bg-surf)', border: '1px solid var(--border)',
          cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: 'var(--bg)', border: '1.5px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#FF4C29',
          }}>
            {initials(s.shop_name)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.shop_name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-hint)' }}>
              {s.city} · {s.post_count || 0} posts
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
