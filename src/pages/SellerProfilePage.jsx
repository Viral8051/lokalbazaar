import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import Layout from '../components/Layout'

export default function SellerProfilePage() {
  const { sellerId } = useParams()
  const navigate = useNavigate()
  const [seller, setSeller] = useState(null)
  const [posts, setPosts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSeller(); fetchPosts() }, [sellerId])

  async function fetchSeller() {
    const { data } = await supabase.from('profiles').select('*').eq('id', sellerId).single()
    setSeller(data)
  }

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select(`*, profiles!posts_seller_id_fkey(shop_name, owner_name, city, category, plan)`)
      .eq('seller_id', sellerId).order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '?'

  if (loading || !seller) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'var(--text-hint)', fontSize:14 }}>Loading...</div>
    </div>
  )

  const availablePosts = posts.filter(p => p.available !== false)

  return (
    <Layout active="">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-theme sticky top-0 bg-theme z-10">
        <button onClick={() => navigate(-1)} className="text-sub hover:text-theme text-xl">←</button>
        <span className="text-theme font-medium text-sm flex-1 truncate">{seller.shop_name}</span>
        <button onClick={() => navigate(`/chat/${sellerId}`)}
          className="text-xs bg-accent text-white px-3 py-1.5 rounded-full font-medium">
          💬 Message
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-6">
        <div className="px-4 pt-4 pb-3">
          <div className="flex gap-4 items-start">
            <div style={{
              width:64, height:64, borderRadius:16, flexShrink:0,
              background:'var(--bg-surf)', border:'2px solid #FF4C29',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, fontWeight:800, color:'#FF4C29',
            }}>
              {initials(seller.shop_name)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-theme">{seller.shop_name}</h1>
                {seller.plan === 'premium' && (
                  <span className="text-[10px] bg-accent-dim text-accent px-1.5 py-0.5 rounded-full">✦ Pro</span>
                )}
              </div>
              <div className="text-xs text-sub mt-0.5">{seller.owner_name} · {seller.city}</div>
              {seller.bio && <p className="text-xs text-sub mt-1 leading-relaxed">{seller.bio}</p>}
              <div className="flex gap-4 mt-2">
                <div><div className="text-sm font-semibold text-theme">{seller.post_count || 0}</div><div className="text-[10px] text-hint">posts</div></div>
                <div><div className="text-sm font-semibold text-theme">{seller.follower_count || 0}</div><div className="text-[10px] text-hint">followers</div></div>
              </div>
            </div>
          </div>
        </div>

        {availablePosts.length > 0 && (
          <>
            <div className="px-4 pb-2">
              <div className="text-xs text-hint uppercase tracking-wider">Available Products</div>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-3">
              {availablePosts.map(post => (
                <div key={post.id} className="flex-shrink-0 w-28 bg-card border border-theme rounded-xl overflow-hidden hover:border-accent transition-colors cursor-pointer">
                  {post.image_url
                    ? <img src={post.image_url} alt={post.caption} className="w-28 h-28 object-cover" loading="lazy" />
                    : <div className="w-28 h-28 bg-surf flex items-center justify-center text-3xl">🛍️</div>
                  }
                  <div className="p-2">
                    <div className="text-[11px] text-theme font-medium truncate">{(post.product_name || post.caption).slice(0,30)}</div>
                    {post.price && <div className="text-[11px] text-accent font-medium mt-0.5">₹{post.price}/{post.unit||'pc'}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="px-4">
          <div className="text-xs text-hint uppercase tracking-wider mb-3">All Posts</div>
          {posts.length === 0
            ? <div className="text-center py-12 text-hint"><div className="text-3xl mb-2">📭</div><div className="text-sm">Abhi koi post nahi</div></div>
            : <div className="flex flex-col gap-4">{posts.map(post => <PostCard key={post.id} post={post} onSellerClick={() => {}} />)}</div>
          }
        </div>
      </div>
    </Layout>
  )
}
