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
import { Bell } from 'lucide-react';

export default function HomePage() {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const [posts, setPosts]             = useState([])
  const [sellers, setSellers]         = useState([])
  const [loading, setLoading]         = useState(true)
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

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>
            <span style={{ color: 'var(--text)' }}>Lokal</span>
            <span style={{ color: '#FF4C29' }}>Bazaar</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>
            📍 {profile?.city || 'Jamnagar'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle />
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-sub)' }}><Bell size={16}/></button>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg)', flexShrink: 0,
      }}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Saree, mithai, handicraft..." />
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }} className="scrollbar-hide">

        {/* Stories */}
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <Stories />
        </div>

        {/* Nearby sellers */}
        {sellers.length > 0 && (
          <div style={{ padding: '16px 16px 8px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Nearby Sellers
            </div>
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }} className="scrollbar-hide">
              {sellers.map(s => (
                <div key={s.id} onClick={() => navigate(`/seller/${s.id}`)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: 15,
                    background: 'var(--bg-card)', border: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: '#FF4C29',
                  }}>
                    {initials(s.shop_name)}
                  </div>
                  <span style={{
                    fontSize: 10, color: 'var(--text-sub)', width: 54,
                    textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {s.shop_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section label */}
        <div style={{ padding: '8px 16px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: 1 }}>
            {searchQuery ? `"${searchQuery}" results` : 'Recent Posts'}
          </div>
        </div>

        {/* Posts */}
        <div style={{ padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 18, height: 300 }} className="animate-pulse" />
            ))
          ) : filteredPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-hint)' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🛍️</div>
              <div style={{ fontSize: 14 }}>{searchQuery ? 'Koi result nahi mila' : 'Abhi koi post nahi hai'}</div>
            </div>
          ) : filteredPosts.map(post => (
            <PostCard key={post.id} post={post} onSellerClick={(id) => navigate(`/seller/${id}`)} />
          ))}
        </div>
      </div>

      {/* FAB */}
      {profile?.role === 'seller' && (
        <button onClick={() => setShowNewPost(true)} style={{
          position: 'fixed', bottom: 80, right: 20,
          width: 54, height: 54, borderRadius: 16,
          background: '#FF4C29', color: 'white',
          fontSize: 26, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(255,76,41,0.4)', zIndex: 20,
        }}>+</button>
      )}

      {showNewPost && (
        <NewPostModal onClose={() => setShowNewPost(false)} onPosted={() => { fetchFeed(); setShowNewPost(false) }} />
      )}
    </Layout>
  )
}
