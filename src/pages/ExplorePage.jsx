import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import Layout from '../components/Layout'

const CATEGORIES = [
  { id:'saree',      label:'Saree & Textile',  emoji:'🥻' },
  { id:'food',       label:'Homemade Food',     emoji:'🍱' },
  { id:'sweets',     label:'Mithai & Sweets',   emoji:'🍬' },
  { id:'handicraft', label:'Handicraft',        emoji:'🏺' },
  { id:'jewellery',  label:'Jewellery',         emoji:'💍' },
  { id:'beauty',     label:'Beauty & Skincare', emoji:'🧴' },
  { id:'clothing',   label:'Clothing',          emoji:'👗' },
  { id:'other',      label:'Other',             emoji:'🛍️' },
]

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

export default function ExplorePage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState(null)
  const [sellers, setSellers]   = useState([])
  const [posts, setPosts]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [listening, setListening]     = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => { fetchAll() }, [activeCategory])

  async function fetchAll() {
    setLoading(true)
    let sellerQuery = supabase.from('profiles').select('*').order('follower_count', { ascending: false })
    let postQuery   = supabase.from('posts').select(`*, profiles!posts_seller_id_fkey(shop_name, owner_name, city, category, plan)`).order('created_at', { ascending: false }).limit(20)
    if (activeCategory) {
      sellerQuery = sellerQuery.eq('category', activeCategory)
      postQuery   = postQuery.eq('profiles.category', activeCategory)
    }
    const [{ data:s }, { data:p }] = await Promise.all([sellerQuery, postQuery])
    setSellers(s || []); setPosts(p || [])
    setLoading(false)
  }

  function startVoice() {
    if (isIOS) {
      inputRef.current?.focus()
      setShowIOSHint(true)
      setTimeout(() => setShowIOSHint(false), 4000)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    try {
      const r = new SR()
      recognitionRef.current = r
      r.lang = 'hi-IN'; r.continuous = false; r.interimResults = false
      r.onstart = () => setListening(true)
      r.onresult = (e) => setSearchQuery(e.results[0][0].transcript)
      r.onerror = () => setListening(false)
      r.onend   = () => setListening(false)
      r.start()
    } catch { setListening(false) }
  }

  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '?'
  const query = (searchQuery || '').toString().toLowerCase()
  const filteredSellers = query ? sellers.filter(s => s.shop_name?.toLowerCase().includes(query) || s.city?.toLowerCase().includes(query)) : sellers
  const filteredPosts   = query ? posts.filter(p => p.caption?.toLowerCase().includes(query) || p.profiles?.shop_name?.toLowerCase().includes(query)) : posts

  return (
    <Layout active="explore">
      <div className="px-4 py-3 border-b border-theme sticky top-0 bg-theme z-10">
        <h1 className="text-base font-semibold text-theme mb-2">Explore</h1>
        <div className="relative flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-input border border-theme rounded-full px-3 py-2">
            <span className="text-sm text-hint">🔍</span>
            <input ref={inputRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Seller ya product dhundo..."
              className="flex-1 bg-transparent text-theme text-sm outline-none placeholder:text-hint" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="text-hint text-xs">✕</button>}
          </div>
          <button onClick={startVoice}
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${listening ? 'bg-red-500 animate-pulse' : 'bg-accent'}`}>
            <span className="text-base text-white">{listening ? '⏺' : '🎙️'}</span>
          </button>
          {showIOSHint && (
            <div className="absolute top-12 right-0 z-50 flex flex-col items-end">
              <div className="flex items-center gap-2 bg-card border border-theme rounded-2xl px-3 py-2 shadow-xl">
                <span className="text-sm">🎙️</span>
                <span className="text-xs text-sub whitespace-nowrap">Keyboard pe mic dabao</span>
              </div>
              <div className="animate-bounce text-accent text-xl mt-1 mr-1">↓</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
          <button onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              !activeCategory ? 'bg-accent text-white border-accent' : 'border-theme text-sub hover:border-theme-md'
            }`}>
            Sab kuch
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                activeCategory === cat.id ? 'bg-accent text-white border-accent' : 'border-theme text-sub hover:border-theme-md'
              }`}>
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="px-4 flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-surf rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {filteredSellers.length > 0 && (
              <div className="px-4 mb-4">
                <div className="text-xs text-hint uppercase tracking-wider mb-3">
                  {activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.label : 'Sellers'} — {filteredSellers.length} found
                </div>
                <div className="flex flex-col gap-2">
                  {filteredSellers.map(s => (
                    <div key={s.id} onClick={() => navigate(`/seller/${s.id}`)}
                      className="flex items-center gap-3 bg-card border border-theme rounded-xl px-3 py-3 cursor-pointer hover:border-accent transition-colors">
                      <div className="w-11 h-11 rounded-xl bg-surf border border-theme flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                        {initials(s.shop_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-theme truncate">{s.shop_name}</span>
                          {s.plan === 'premium' && <span className="text-[10px] bg-accent-dim text-accent px-1.5 py-0.5 rounded-full flex-shrink-0">✦ Pro</span>}
                        </div>
                        <div className="text-xs text-sub">{s.city} · {s.post_count || 0} posts</div>
                      </div>
                      <div className="text-hint text-lg">›</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredPosts.length > 0 && (
              <div className="px-4">
                <div className="text-xs text-hint uppercase tracking-wider mb-3">
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
              <div className="text-center py-16 text-hint">
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
