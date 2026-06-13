import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'
import SubscriptionBanner from '../components/SubscriptionBanner'
import NewPostModal from '../components/NewPostModal'
import Layout from '../components/Layout'

export default function ProfilePage() {
  const { user, profile, signOut, fetchProfile } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (user) fetchPosts() }, [user])
  useEffect(() => { if (profile) setEditForm({ shop_name: profile.shop_name, bio: profile.bio || '', city: profile.city }) }, [profile])

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
    setPosts(p => p.filter(p => p.id !== postId))
    await supabase.from('profiles').update({ post_count: Math.max(0, (profile.post_count || 1) - 1) }).eq('id', user.id)
    await fetchProfile(user.id)
  }

  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  const postsLeft = Math.max(0, 10 - (profile?.post_count || 0))
  const isPremium = profile?.plan === 'premium'

  return (
    <Layout active="profile">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0f0a1e] z-10">
        <h1 className="text-base font-semibold text-white">My Profile</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(e => !e)} className="text-xs text-white/50 hover:text-white transition-colors">
            {editing ? 'Cancel' : '✏️ Edit'}
          </button>
          <button onClick={signOut} className="text-xs text-white/30 hover:text-red-400 transition-colors">Logout</button>
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
                  <input
                    value={editForm.shop_name || ''}
                    onChange={e => setEditForm(f => ({ ...f, shop_name: e.target.value }))}
                    placeholder="Dukaan ka naam"
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-[#f5a623] transition-colors"
                  />
                  <input
                    value={editForm.city || ''}
                    onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Sheher"
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-[#f5a623] transition-colors"
                  />
                  <textarea
                    value={editForm.bio || ''}
                    onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Apne baare mein batao..."
                    rows={2}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-[#f5a623] transition-colors resize-none"
                  />
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="bg-[#f5a623] text-white text-xs font-medium py-2 rounded-lg hover:bg-[#e09520] transition-colors disabled:opacity-50"
                  >
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

        {/* Subscription banner */}
        {!isPremium && (
          <div className="mx-4 mb-4 bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#f5a623]">Free Plan</span>
              <span className="text-xs text-white/50">{postsLeft} posts baaki</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
              <div
                className="bg-[#f5a623] h-1.5 rounded-full transition-all"
                style={{ width: `${((10 - postsLeft) / 10) * 100}%` }}
              />
            </div>
            <button className="w-full bg-[#f5a623] text-white text-xs font-medium py-2 rounded-lg hover:bg-[#e09520] transition-colors">
              ✦ Premium lo — Unlimited posts
            </button>
          </div>
        )}

        {/* Add post button */}
        <div className="px-4 mb-4">
          <button
            onClick={() => setShowNewPost(true)}
            disabled={!isPremium && postsLeft <= 0}
            className="w-full border border-dashed border-[#f5a623]/40 text-[#f5a623] rounded-xl py-3 text-sm flex items-center justify-center gap-2 hover:border-[#f5a623] hover:bg-[#f5a623]/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + Naya product add karo
          </button>
        </div>

        {/* My posts */}
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
                  <button
                    onClick={() => deletePost(post.id)}
                    className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 text-white text-xs px-2 py-1 rounded-lg transition-colors"
                  >
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
