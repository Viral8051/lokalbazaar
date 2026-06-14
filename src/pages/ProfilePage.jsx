import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'
import NewPostModal from '../components/NewPostModal'
import Layout from '../components/Layout'

// ── Account Switcher Dropdown ──────────────────────────────────
function AccountSwitcherDropdown({ profile, user, onClose }) {
  const navigate  = useNavigate()
  const { savedAccounts, signOut, signOutAndRemove, switchAccount } = useAuth()
  const ref = useRef()

  // Outside click se close
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  const otherAccounts = savedAccounts.filter(a => a.id !== user?.id)

  async function handleSwitch(email) {
    onClose()
    const prefillEmail = await switchAccount(email)
    // Login page pe jaao, email pre-fill ke saath
    navigate('/login', { state: { prefillEmail } })
  }

  async function handleAddAccount() {
    onClose()
    await supabase.auth.signOut()
    navigate('/login', { state: { addAccount: true } })
  }

  return (
    <div
      ref={ref}
      className="absolute top-16 left-4 right-4 z-50 bg-[#1a1030] border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Current account */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Current Account</div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f5a623]/20 border-2 border-[#f5a623] flex items-center justify-center text-[#f5a623] font-bold text-sm flex-shrink-0">
            {initials(profile?.role === 'buyer' ? profile?.owner_name : profile?.shop_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {profile?.role === 'buyer' ? profile?.owner_name : profile?.shop_name}
            </div>
            <div className="text-[10px] text-white/40 truncate">{user?.email}</div>
          </div>
          <div className="text-[10px] bg-[#f5a623]/20 text-[#f5a623] px-2 py-0.5 rounded-full capitalize">
            {profile?.role === 'buyer' ? '🛒' : '🏪'} {profile?.role}
          </div>
        </div>
      </div>

      {/* Saved accounts */}
      {otherAccounts.length > 0 && (
        <div className="border-b border-white/10">
          <div className="px-4 pt-3 pb-1">
            <div className="text-[10px] text-white/30 uppercase tracking-wider">Saved Accounts</div>
          </div>
          {otherAccounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => handleSwitch(acc.email)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 font-bold text-sm flex-shrink-0">
                {initials(acc.name)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm text-white/80 truncate">{acc.name}</div>
                <div className="text-[10px] text-white/40 truncate">{acc.email}</div>
              </div>
              <div className="text-[10px] text-white/30 capitalize">{acc.role === 'buyer' ? '🛒' : '🏪'}</div>
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="p-2">
        <button
          onClick={handleAddAccount}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/40 text-lg">
            +
          </div>
          <span className="text-sm text-white/60">Naya account add karo</span>
        </button>

        <button
          onClick={() => { onClose(); signOut() }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/30 text-sm">
            ↩
          </div>
          <span className="text-sm text-white/40">Logout (account save rahega)</span>
        </button>

        <button
          onClick={() => { onClose(); signOutAndRemove() }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full border border-red-500/20 flex items-center justify-center text-red-400/60 text-sm">
            ✕
          </div>
          <span className="text-sm text-red-400/60">Logout & remove account</span>
        </button>
      </div>
    </div>
  )
}

// ── Avatar Button (har jagah use hoga) ────────────────────────
function AvatarWithSwitcher({ profile, user }) {
  const [open, setOpen] = useState(false)
  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  const displayName = profile?.role === 'buyer' ? profile?.owner_name : profile?.shop_name

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 group"
      >
        <div className="w-8 h-8 rounded-full bg-[#f5a623]/20 border-2 border-[#f5a623] flex items-center justify-center text-[#f5a623] font-bold text-xs transition-transform group-active:scale-95">
          {initials(displayName)}
        </div>
        <span className="text-white/40 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <AccountSwitcherDropdown
          profile={profile}
          user={user}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

// ── Buyer Profile ──────────────────────────────────────────────
function BuyerProfile({ profile, user, fetchProfile }) {
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    owner_name: profile?.owner_name || '',
    phone:      profile?.phone || '',
    city:       profile?.city  || '',
  })
  const [saving, setSaving] = useState(false)

  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  async function saveProfile() {
    setSaving(true)
    await supabase.from('profiles').update(editForm).eq('id', user.id)
    await fetchProfile(user.id)
    setSaving(false)
    setEditing(false)
  }

  return (
    <Layout active="profile">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0f0a1e] z-10">
        <AvatarWithSwitcher profile={profile} user={user} />
        <h1 className="text-base font-semibold text-white">My Profile</h1>
        <button
          onClick={() => setEditing(e => !e)}
          className="text-xs text-white/50 hover:text-white transition-colors"
        >
          {editing ? 'Cancel' : '✏️ Edit'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-10">
        <div className="px-4 pt-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">

            <div className="flex flex-col items-center mb-5">
              <div className="w-20 h-20 rounded-full bg-[#f5a623]/20 border-2 border-[#f5a623] flex items-center justify-center text-[#f5a623] font-bold text-2xl mb-2">
                {initials(profile?.owner_name)}
              </div>
              <span className="text-xs text-white/40 bg-white/5 px-3 py-1 rounded-full">🛒 Buyer</span>
            </div>

            {editing ? (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Naam</label>
                  <input value={editForm.owner_name} onChange={e => setEditForm(f => ({ ...f, owner_name: e.target.value }))}
                    placeholder="Tumhara naam"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#f5a623] transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Phone</label>
                  <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 98765 43210" type="tel"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#f5a623] transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Sheher</label>
                  <input value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Jamnagar"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#f5a623] transition-colors" />
                </div>
                <button onClick={saveProfile} disabled={saving}
                  className="w-full bg-[#f5a623] text-white text-sm font-medium py-2.5 rounded-xl hover:bg-[#e09520] transition-colors disabled:opacity-50 mt-1">
                  {saving ? 'Save ho raha hai...' : 'Save karo ✓'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <InfoRow icon="👤" label="Naam"   value={profile?.owner_name || '—'} />
                <InfoRow icon="📧" label="Email"  value={profile?.email || '—'} />
                <InfoRow icon="📞" label="Phone"  value={profile?.phone || 'Add karo'} faded={!profile?.phone} />
                <InfoRow icon="📍" label="Sheher" value={profile?.city  || '—'} />
                <InfoRow icon="📅" label="Member since" value={
                  profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('hi-IN', { year: 'numeric', month: 'long' })
                    : '—'
                } />
              </div>
            )}
          </div>
        </div>

        {!editing && (
          <div className="px-4 mt-4">
            <div className="bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">🛍️</div>
              <p className="text-sm text-white/70 font-medium">Kuch dhundh rahe ho?</p>
              <p className="text-xs text-white/40 mt-0.5 mb-3">Apne sheher ke sellers explore karo</p>
              <a href="/explore" className="inline-block bg-[#f5a623] text-white text-xs font-semibold px-5 py-2 rounded-xl hover:bg-[#e09520] transition-colors">
                Explore karo →
              </a>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function InfoRow({ icon, label, value, faded }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-base w-6 text-center">{icon}</span>
      <div className="flex-1">
        <div className="text-[10px] text-white/30 uppercase tracking-wide">{label}</div>
        <div className={`text-sm mt-0.5 ${faded ? 'text-white/30 italic' : 'text-white'}`}>{value}</div>
      </div>
    </div>
  )
}

// ── Seller Profile ─────────────────────────────────────────────
function SellerProfile({ profile, user, fetchProfile }) {
  const navigate = useNavigate()
  const [posts, setPosts]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [editing, setEditing]     = useState(false)
  const [editForm, setEditForm]   = useState({})
  const [saving, setSaving]       = useState(false)

  useEffect(() => { if (user) fetchPosts() }, [user])
  useEffect(() => {
    if (profile) setEditForm({ shop_name: profile.shop_name, bio: profile.bio || '', city: profile.city })
  }, [profile])

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select(`*, profiles!posts_seller_id_fkey(shop_name, owner_name, city, category, plan)`)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    await supabase.from('profiles').update(editForm).eq('id', user.id)
    await fetchProfile(user.id)
    setSaving(false)
    setEditing(false)
  }

  async function deletePost(postId) {
    if (!confirm('Yeh post delete karo?')) return
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(p => p.filter(x => x.id !== postId))
    await supabase.from('profiles').update({ post_count: Math.max(0, (profile.post_count || 1) - 1) }).eq('id', user.id)
    await fetchProfile(user.id)
  }

  const initials   = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  const postsLeft  = Math.max(0, 10 - (profile?.post_count || 0))
  const isPremium  = profile?.plan === 'premium'

  return (
    <Layout active="profile">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0f0a1e] z-10">
        <AvatarWithSwitcher profile={profile} user={user} />
        <h1 className="text-base font-semibold text-white">My Profile</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(e => !e)} className="text-xs text-white/50 hover:text-white transition-colors">
            {editing ? 'Cancel' : '✏️ Edit'}
          </button>
          <button onClick={() => navigate('/analytics')} className="text-xs text-white/50 hover:text-white transition-colors">
            📊
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-6">
        {/* Profile card */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex gap-4 items-start">
            <div className="w-16 h-16 rounded-full bg-[#f5a623]/20 border-2 border-[#f5a623] flex items-center justify-center text-[#f5a623] font-bold text-xl flex-shrink-0">
              {initials(profile?.shop_name)}
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="flex flex-col gap-2">
                  <input value={editForm.shop_name || ''} onChange={e => setEditForm(f => ({ ...f, shop_name: e.target.value }))}
                    placeholder="Dukaan ka naam"
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-[#f5a623] transition-colors" />
                  <input value={editForm.city || ''} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Sheher"
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-[#f5a623] transition-colors" />
                  <textarea value={editForm.bio || ''} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Apne baare mein..." rows={2}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-[#f5a623] transition-colors resize-none" />
                  <button onClick={saveProfile} disabled={saving}
                    className="bg-[#f5a623] text-white text-xs font-medium py-2 rounded-lg hover:bg-[#e09520] transition-colors disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save karo'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-white">{profile?.shop_name || 'Your Shop'}</h2>
                    {isPremium && <span className="text-[10px] bg-[#f5a623]/20 text-[#f5a623] px-1.5 py-0.5 rounded-full">✦ Pro</span>}
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">{profile?.owner_name} · {profile?.city}</div>
                  {profile?.bio && <p className="text-xs text-white/60 mt-1 leading-relaxed">{profile.bio}</p>}
                  <div className="flex gap-4 mt-2">
                    <div><span className="text-sm font-semibold text-white">{profile?.post_count || 0}</span> <span className="text-xs text-white/40">posts</span></div>
                    <div><span className="text-sm font-semibold text-white">{profile?.follower_count || 0}</span> <span className="text-xs text-white/40">followers</span></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Free plan banner */}
        {!isPremium && (
          <div className="mx-4 mb-4 bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#f5a623]">Free Plan</span>
              <span className="text-xs text-white/50">{postsLeft} posts baaki</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
              <div className="bg-[#f5a623] h-1.5 rounded-full transition-all" style={{ width: `${((10 - postsLeft) / 10) * 100}%` }} />
            </div>
            <button className="w-full bg-[#f5a623] text-white text-xs font-medium py-2 rounded-lg hover:bg-[#e09520] transition-colors">
              ✦ Premium lo — Unlimited posts
            </button>
          </div>
        )}

        <div className="px-4 mb-4">
          <button onClick={() => setShowNewPost(true)} disabled={!isPremium && postsLeft <= 0}
            className="w-full border border-dashed border-[#f5a623]/40 text-[#f5a623] rounded-xl py-3 text-sm flex items-center justify-center gap-2 hover:border-[#f5a623] hover:bg-[#f5a623]/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            + Naya product add karo
          </button>
        </div>

        <div className="px-4">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Mere Posts ({posts.length})</div>
          {loading ? (
            <div className="flex flex-col gap-3">{[1,2].map(i => <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />)}</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <div className="text-3xl mb-2">📸</div>
              <div className="text-sm">Abhi koi post nahi</div>
              <div className="text-xs mt-1">Pehla product add karo!</div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map(post => (
                <div key={post.id} className="relative">
                  <PostCard post={post} onSellerClick={() => {}} />
                  <button onClick={() => deletePost(post.id)}
                    className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 text-white text-xs px-2 py-1 rounded-lg transition-colors">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewPost && (
        <NewPostModal
          onClose={() => setShowNewPost(false)}
          onPosted={() => { fetchPosts(); fetchProfile(user.id); setShowNewPost(false) }}
        />
      )}
    </Layout>
  )
}

// ── Main Export ────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, profile, fetchProfile } = useAuth()

  if (!profile) return (
    <div className="min-h-screen bg-[#0f0a1e] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (profile.role === 'buyer') {
    return <BuyerProfile profile={profile} user={user} fetchProfile={fetchProfile} />
  }
  return <SellerProfile profile={profile} user={user} fetchProfile={fetchProfile} />
}
