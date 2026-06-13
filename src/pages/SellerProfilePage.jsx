import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import Layout from '../components/Layout'

export default function SellerProfilePage() {
  const { sellerId } = useParams()
  const navigate = useNavigate()
  const [seller, setSeller] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSeller(); fetchPosts() }, [sellerId])

  async function fetchSeller() {
    const { data } = await supabase.from('profiles').select('*').eq('id', sellerId).single()
    setSeller(data)
  }

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select(`*, profiles(shop_name, owner_name, city, category, plan)`)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  if (loading || !seller) return (
    <div className="min-h-screen bg-[#0f0a1e] flex items-center justify-center">
      <div className="text-white/30 text-sm">Loading...</div>
    </div>
  )

  const availablePosts = posts.filter(p => p.available !== false)

  return (
    <Layout active="">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0f0a1e] z-10">
        <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white text-xl">←</button>
        <span className="text-white font-medium text-sm flex-1 truncate">{seller.shop_name}</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-6">
        {/* Profile info */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex gap-4 items-start">
            <div className="w-16 h-16 rounded-full bg-[#f5a623]/20 border-2 border-[#f5a623] flex items-center justify-center text-[#f5a623] font-bold text-xl flex-shrink-0">
              {initials(seller.shop_name)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-white">{seller.shop_name}</h1>
                {seller.plan === 'premium' && <span className="text-[10px] bg-[#f5a623]/20 text-[#f5a623] px-1.5 py-0.5 rounded-full">✦ Pro</span>}
              </div>
              <div className="text-xs text-white/50 mt-0.5">{seller.owner_name} · {seller.city}</div>
              {seller.bio && <p className="text-xs text-white/60 mt-1 leading-relaxed">{seller.bio}</p>}
              <div className="flex gap-4 mt-2">
                <div className="text-center"><div className="text-sm font-semibold text-white">{seller.post_count || 0}</div><div className="text-[10px] text-white/40">posts</div></div>
                <div className="text-center"><div className="text-sm font-semibold text-white">{seller.follower_count || 0}</div><div className="text-[10px] text-white/40">followers</div></div>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/chat/${sellerId}`)}
            className="w-full mt-3 bg-[#f5a623] text-white font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-[#e09520] transition-colors"
          >
            💬 Message karo
          </button>
        </div>

        {/* Product swiper */}
        {availablePosts.length > 0 && (
          <>
            <div className="px-4 pb-1"><div className="text-xs text-white/40 uppercase tracking-wider">Available Products</div></div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-3">
              {availablePosts.map(post => (
                <div key={post.id} className="flex-shrink-0 w-28 bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#f5a623]/40 transition-colors cursor-pointer">
                  {post.image_url
                    ? <img src={post.image_url} alt={post.caption} className="w-28 h-28 object-cover" loading="lazy" />
                    : <div className="w-28 h-28 bg-white/10 flex items-center justify-center text-3xl">🛍️</div>
                  }
                  <div className="p-2">
                    <div className="text-[11px] text-white font-medium truncate">{post.caption.slice(0, 30)}</div>
                    {post.price && <div className="text-[11px] text-[#f5a623] font-medium mt-0.5">{post.price}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* All posts */}
        <div className="px-4">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-3">All Posts</div>
          {posts.length === 0
            ? <div className="text-center py-12 text-white/30"><div className="text-3xl mb-2">📭</div><div className="text-sm">Abhi koi post nahi</div></div>
            : <div className="flex flex-col gap-4">{posts.map(post => <PostCard key={post.id} post={post} onSellerClick={() => {}} />)}</div>
          }
        </div>
      </div>
    </Layout>
  )
}
