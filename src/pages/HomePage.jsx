import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import NewPostModal from '../components/NewPostModal'
import SearchBar from '../components/SearchBar'
import SellerChip from '../components/SellerChip'
import PostCard from '../components/PostCard'
import Stories from '../components/Stories'
import Layout from '../components/Layout'

export default function HomePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [listening, setListening] = useState(false)

  useEffect(() => { fetchFeed(); fetchNearbySellers() }, [])

  async function fetchFeed() {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select(`*, profiles!posts_seller_id_fkey(shop_name, owner_name, city, category, plan)`)
      .order('created_at', { ascending: false })
      .limit(30)
    setPosts(data || [])
    setLoading(false)
  }

  async function fetchNearbySellers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, shop_name, owner_name, category, city')
      .order('follower_count', { ascending: false })
      .limit(10)
    setSellers(data || [])
  }

  function startVoiceSearch() {
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

  const filteredPosts = query
    ? posts.filter(p =>
        p.caption?.toLowerCase().includes(query) ||
        p.profiles?.shop_name?.toLowerCase().includes(query)
      )
    : posts

  return (
    <Layout active="home">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 sticky top-0 z-10 bg-[#0f0a1e]">
        <span className="text-[#f5a623] font-bold flex-1 text-base md:hidden">📍 LokalBazaar</span>
        <span className="text-sm font-semibold text-white flex-1 hidden md:block">Home Feed</span>
        <span className="text-xs text-white/40">{profile?.city || 'Jamnagar'}</span>
        <button className="text-white/60 text-xl">🔔</button>
      </div>

      {/* Search bar */}
      <div className="px-4 py-2 flex gap-2 items-center border-b border-white/5 sticky top-[52px] z-10 bg-[#0f0a1e]">
        <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-2">
          <span className="text-sm">🔍</span>
          <input
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Saree, mithai, handicraft..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white text-xs">✕</button>
          )}
        </div>
        <button
          onClick={startVoiceSearch}
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${listening ? 'bg-red-500 animate-pulse' : 'bg-[#f5a623]'}`}
        >
          <span className="text-base">{listening ? '⏺' : '🎙️'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Stories */}
        <div className="border-b border-white/5">
          <Stories />
        </div>

        {/* Nearby sellers */}
        {sellers.length > 0 && (
          <div className="px-4 pt-3 pb-1">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Nearby Sellers</div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {sellers.map(s => (
                <div key={s.id} onClick={() => navigate(`/seller/${s.id}`)} className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-[#f5a623]/20 border-2 border-[#f5a623]/30 hover:border-[#f5a623] transition-colors flex items-center justify-center text-[#f5a623] font-bold text-sm">
                    {initials(s.shop_name)}
                  </div>
                  <span className="text-[10px] text-white/50 w-14 text-center truncate">{s.shop_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="px-4 pt-2 pb-6">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-3">
            {searchQuery ? `"${searchQuery}" results` : 'Recent Posts'}
          </div>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="bg-white/5 rounded-2xl h-72 animate-pulse" />)}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <div className="text-4xl mb-3">🛍️</div>
              <div className="text-sm">{searchQuery ? 'Koi result nahi mila' : 'Abhi koi post nahi hai'}</div>
              {!searchQuery && <div className="text-xs mt-1">+ button se pehla product add karo!</div>}
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
        <button
          onClick={() => setShowNewPost(true)}
          className="fixed bottom-24 right-6 md:bottom-8 w-14 h-14 bg-[#f5a623] rounded-full flex items-center justify-center text-white text-2xl hover:bg-[#e09520] transition-colors z-20 shadow-lg"
        >
          +
        </button>
      )}

      {showNewPost && (
        <NewPostModal onClose={() => setShowNewPost(false)} onPosted={() => { fetchFeed(); setShowNewPost(false) }} />
      )}
    </Layout>
  )
}
