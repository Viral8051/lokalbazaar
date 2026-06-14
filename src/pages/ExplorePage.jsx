import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import Layout from '../components/Layout'

const CATEGORIES = [
  { id: 'saree', label: 'Saree & Textile', emoji: '🥻' },
  { id: 'food', label: 'Homemade Food', emoji: '🍱' },
  { id: 'sweets', label: 'Mithai & Sweets', emoji: '🍬' },
  { id: 'handicraft', label: 'Handicraft', emoji: '🏺' },
  { id: 'jewellery', label: 'Jewellery', emoji: '💍' },
  { id: 'beauty', label: 'Beauty & Skincare', emoji: '🧴' },
  { id: 'clothing', label: 'Clothing', emoji: '👗' },
  { id: 'other', label: 'Other', emoji: '🛍️' },
]

export default function ExplorePage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState(null)
  const [sellers, setSellers] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [listening, setListening] = useState(false)

  useEffect(() => { fetchAll() }, [activeCategory])

  async function fetchAll() {
    setLoading(true)
    let sellerQuery = supabase.from('profiles').select('*').order('follower_count', { ascending: false })
    let postQuery = supabase.from('posts').select(`*, profiles!posts_seller_id_fkey(shop_name, owner_name, city, category, plan)`).order('created_at', { ascending: false }).limit(20)

    if (activeCategory) {
      sellerQuery = sellerQuery.eq('category', activeCategory)
      postQuery = postQuery.eq('profiles.category', activeCategory)
    }

    const [{ data: s }, { data: p }] = await Promise.all([sellerQuery, postQuery])
    setSellers(s || [])
    setPosts(p || [])
    setLoading(false)
  }

  function startVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'hi-IN'
    recognition.interimResults = false
    recognition.onstart = () => setListening(true)
    recognition.onresult = (e) => setSearchQuery(e.results[0][0].transcript)
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
  }

  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  const query = (searchQuery || '').toString().toLowerCase()

  const filteredSellers = query
  ? sellers.filter(s =>
      s.shop_name?.toLowerCase().includes(query) ||
      s.city?.toLowerCase().includes(query)
    )
  : sellers

  const filteredPosts = query
  ? posts.filter(p =>
      p.caption?.toLowerCase().includes(query) ||
      p.profiles?.shop_name?.toLowerCase().includes(query)
    )
  : posts

  return (
    <Layout active="explore">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0f0a1e] z-10">
        <h1 className="text-base font-semibold text-white mb-2">Explore</h1>
        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-2">
            <span className="text-sm">🔍</span>
            <input
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Seller ya product dhundo..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="text-white/40 text-xs">✕</button>}
          </div>
          <button
            onClick={startVoice}
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${listening ? 'bg-red-500 animate-pulse' : 'bg-[#f5a623]'}`}
          >
            <span className="text-base">{listening ? '⏺' : '🎙️'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-6">
        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              !activeCategory ? 'bg-[#f5a623] text-white border-[#f5a623]' : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white'
            }`}
          >
            Sab kuch
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                activeCategory === cat.id ? 'bg-[#f5a623] text-white border-[#f5a623]' : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white'
              }`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="px-4 flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Sellers section */}
            {filteredSellers.length > 0 && (
              <div className="px-4 mb-4">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-3">
                  {activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.label : 'Sellers'} — {filteredSellers.length} found
                </div>
                <div className="flex flex-col gap-2">
                  {filteredSellers.map(s => (
                    <div
                      key={s.id}
                      onClick={() => navigate(`/seller/${s.id}`)}
                      className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-3 cursor-pointer hover:border-[#f5a623]/40 transition-colors"
                    >
                      <div className="w-11 h-11 rounded-full bg-[#f5a623]/20 border border-[#f5a623]/30 flex items-center justify-center text-[#f5a623] font-bold text-sm flex-shrink-0">
                        {initials(s.shop_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{s.shop_name}</span>
                          {s.plan === 'premium' && <span className="text-[10px] bg-[#f5a623]/20 text-[#f5a623] px-1.5 py-0.5 rounded-full flex-shrink-0">✦ Pro</span>}
                        </div>
                        <div className="text-xs text-white/40">{s.city} · {s.post_count || 0} posts</div>
                      </div>
                      <div className="text-white/30 text-lg">›</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts section */}
            {filteredPosts.length > 0 && (
              <div className="px-4">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-3">
                  {searchQuery ? `"${searchQuery}" posts` : 'Recent Posts'}
                </div>
                <div className="flex flex-col gap-4">
                  {filteredPosts.map(post => (
                    <PostCard key={post.id} post={post} onSellerClick={(id) => navigate(`/seller/${id}`)} />
                  ))}
                </div>
              </div>
            )}

            {filteredSellers.length === 0 && filteredPosts.length === 0 && (
              <div className="text-center py-16 text-white/30">
                <div className="text-4xl mb-3">🔍</div>
                <div className="text-sm">{searchQuery ? `"${searchQuery}" kuch nahi mila` : 'Is category mein abhi koi seller nahi'}</div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
