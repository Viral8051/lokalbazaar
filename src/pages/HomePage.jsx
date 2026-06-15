import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import NewPostModal from '../components/NewPostModal'
import SearchBar from '../components/SearchBar'
import PostCard from '../components/PostCard'
import Stories from '../components/Stories'
import Layout from '../components/Layout'
import ThemeToggle from '../components/ThemeToggle'

export default function HomePage() {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const [posts, setPosts]         = useState([])
  const [sellers, setSellers]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { fetchFeed(); fetchNearbySellers() }, [])

  async function fetchFeed() {
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select(`*, profiles!posts_seller_id_fkey(shop_name, owner_name, city, category, plan)`)
      .order('created_at', { ascending: false }).limit(30)
    setPosts(data || [])
    setLoading(false)
  }

  async function fetchNearbySellers() {
    const { data } = await supabase
      .from('profiles').select('id, shop_name, owner_name, category, city')
      .eq('is_seller', true)
      .order('follower_count', { ascending: false }).limit(10)
    setSellers(data || [])
  }

  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  const query = typeof searchQuery === 'string' ? searchQuery.toLowerCase() : ''
  const filteredPosts = query
    ? posts.filter(p =>
        p.caption?.toLowerCase().includes(query) ||
        p.product_name?.toLowerCase().includes(query) ||
        p.profiles?.shop_name?.toLowerCase().includes(query)
      )
    : posts

  return (
    <Layout active="home">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
            Lokal<span style={{ color: '#FF4C29' }}>Bazaar</span>
          </span>
          <div style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 1 }}>📍 {profile?.city || 'Jamnagar'}</div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button style={{ color: 'var(--text-sub)', fontSize: 20 }}>🔔</button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b sticky z-10"
        style={{ top: 60, background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Saree, mithai, handicraft..."
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Stories */}
        <div className="border-b" style={{ borderColor: 'var(--border)' }}>
          <Stories />
        </div>

        {/* Nearby sellers */}
        {sellers.length > 0 && (
          <div className="px-4 pt-3 pb-2">
            <div style={{ fontSize: 11, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Nearby Sellers
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {sellers.map(s => (
                <div key={s.id} onClick={() => navigate(`/seller/${s.id}`)}
                  className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0">
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: 'var(--bg-card)', border: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: '#FF4C29'
                  }}>
                    {initials(s.shop_name)}
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-sub)', width: 52, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.shop_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="px-4 pt-2 pb-24">
          <div style={{ fontSize: 11, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            {searchQuery ? `"${searchQuery}" results` : 'Recent Posts'}
          </div>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => (
                <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 16, height: 280 }}
                  className="animate-pulse" />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-hint)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛍️</div>
              <div style={{ fontSize: 14 }}>{searchQuery ? 'Koi result nahi mila' : 'Abhi koi post nahi hai'}</div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredPosts.map(post => (
                <PostCard key={post.id} post={post} onSellerClick={(id) => navigate(`/seller/${id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      {profile?.role === 'seller' && (
        <button onClick={() => setShowNewPost(true)}
          style={{
            position: 'fixed', bottom: 84, right: 20,
            width: 52, height: 52, borderRadius: 16,
            background: '#FF4C29', color: 'white',
            fontSize: 24, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(255,76,41,0.4)', zIndex: 20,
          }}>
          +
        </button>
      )}

      {showNewPost && (
        <NewPostModal
          onClose={() => setShowNewPost(false)}
          onPosted={() => { fetchFeed(); setShowNewPost(false) }}
        />
      )}
    </Layout>
  )
}
