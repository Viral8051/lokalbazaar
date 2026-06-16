import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

function StatCard({ emoji, label, value, sub }) {
  return (
    <div className="bg-surf border border-theme rounded-2xl p-4 flex flex-col gap-1">
      <div className="text-2xl">{emoji}</div>
      <div className="text-2xl font-bold text-theme">{value ?? '—'}</div>
      <div className="text-xs font-medium text-sub">{label}</div>
      {sub && <div className="text-[11px] text-hint">{sub}</div>}
    </div>
  )
}

function PostRow({ post }) {
  const timeAgo = (d) => {
    const diff = (Date.now() - new Date(d)) / 1000
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
    return `${Math.floor(diff/86400)}d ago`
  }
  return (
    <div className="flex items-center gap-3 border-b border-theme last:border-0">
      {post.image_url
        ? <img src={post.image_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        : <div className="w-12 h-12 rounded-xl bg-surf flex items-center justify-center text-xl flex-shrink-0">🛍️</div>
      }
      <div className="flex-1 min-w-0">
        <div className="text-sm text-theme truncate">{post.caption}</div>
        <div className="text-xs text-hint mt-0.5">{timeAgo(post.created_at)}</div>
      </div>
      <div className="flex gap-3 flex-shrink-0 text-xs text-sub">
        <span>❤️ {post.like_count || 0}</span>
        <span>💬 {post.comment_count || 0}</span>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')

  useEffect(() => { if (user) { fetchAnalytics(); fetchPosts() } }, [user, period])

  async function fetchAnalytics() {
    const { data } = await supabase.from('seller_analytics').select('*').eq('seller_id', user.id).single()
    setAnalytics(data)
  }

  async function fetchPosts() {
    setLoading(true)
    let query = supabase.from('posts').select('*').eq('seller_id', user.id).order('created_at', { ascending: false })
    if (period === 'week') query = query.gte('created_at', new Date(Date.now() - 7*86400000).toISOString())
    else if (period === 'month') query = query.gte('created_at', new Date(Date.now() - 30*86400000).toISOString())
    const { data } = await query.limit(20)
    setPosts(data || [])
    setLoading(false)
  }

  const topPost = posts.length > 0
    ? posts.reduce((a, b) => (a.like_count||0)+(a.comment_count||0) > (b.like_count||0)+(b.comment_count||0) ? a : b)
    : null

  const engagementRate = analytics?.total_posts > 0
    ? (((analytics.total_likes + analytics.total_comments) / analytics.total_posts)).toFixed(1)
    : '0'

  return (
    <Layout active="profile">
      <div className="flex items-center gap-3 border-b border-theme sticky top-0 bg-theme z-10" style={{padding:'12px 16px'}}>
        <button onClick={() => navigate(-1)} className="text-sub hover:text-theme text-xl">←</button>
        <h1 className="text-base font-semibold text-theme flex-1">Analytics</h1>
        {profile?.plan !== 'premium' && (
          <button onClick={() => navigate('/premium')} className="text-xs bg-accent-dim text-accent px-3 py-1 rounded-full">
            ✦ Premium
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide" style={{padding:'12px 16px'}}>
        <div className="flex gap-2" style={{margin:'0 0 12px'}}>
          {[{ id:'week', label:'Is hafte' }, { id:'month', label:'Is mahine' }, { id:'all', label:'Sab time' }].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={` rounded-full text-xs font-medium transition-colors border ${
                period === p.id ? 'bg-accent border-accent text-white' : 'border-theme text-sub hover:border-theme-md'
              }`} style={{padding:'4px 8px'}}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="" style={{margin:'0 0 12px'}}>
          <div className="text-xs text-hint uppercase tracking-wider" style={{margin : '0 0 12px'}}>Overview</div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard emoji="📸" label="Total Posts"  value={analytics?.total_posts    || 0} sub="Published products" />
            <StatCard emoji="❤️" label="Total Likes"  value={analytics?.total_likes    || 0} sub="Across all posts" />
            <StatCard emoji="💬" label="Comments"     value={analytics?.total_comments || 0} sub="Buyer interactions" />
            <StatCard emoji="📩" label="Messages"     value={analytics?.total_messages || 0} sub="Direct inquiries" />
          </div>
        </div>

        <div className="" style={{margin:'0 0 12px'}}>
          <div className="text-xs text-hint uppercase tracking-wider" style={{margin : '0 0 12px'}}>Engagement</div>
          <div className="bg-surf border border-theme rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-2xl font-bold text-theme">{engagementRate}</div>
                <div className="text-xs text-sub">Avg engagement per post</div>
              </div>
              <div className="text-4xl">📊</div>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label:'Likes',    value: analytics?.total_likes    || 0, color:'#FF4C29' },
                { label:'Comments', value: analytics?.total_comments || 0, color:'#e8a598' },
                { label:'Messages', value: analytics?.total_messages || 0, color:'#60a5fa' },
              ].map(({ label, value, color }) => {
                const total = (analytics?.total_likes||0) + (analytics?.total_comments||0) + (analytics?.total_messages||0)
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div className="text-xs text-hint w-20">{label}</div>
                    <div className="flex-1 bg-input rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, total > 0 ? (value/total)*100 : 0)}%`, background: color }} />
                    </div>
                    <div className="text-xs text-sub w-8 text-right">{value}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {topPost && (
          <div className="" style={{margin:'0 0 12px'}}>
            <div className="text-xs text-hint uppercase tracking-wider" style={{margin : '0 0 12px'}}>Top Post 🏆</div>
            <div className="bg-accent-dim border border-accent rounded-2xl p-3 flex items-center gap-3" style={{ borderColor:'rgba(255,76,41,0.2)' }}>
              {topPost.image_url
                ? <img src={topPost.image_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                : <div className="w-14 h-14 rounded-xl bg-surf flex items-center justify-center text-2xl flex-shrink-0">🛍️</div>
              }
              <div className="flex-1 min-w-0">
                <div className="text-sm text-theme font-medium truncate">{topPost.caption}</div>
                <div className="flex gap-3 mt-1 text-xs text-sub">
                  <span>❤️ {topPost.like_count || 0}</span>
                  <span>💬 {topPost.comment_count || 0}</span>
                  {topPost.price && <span className="accent">{topPost.price}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="" style={{margin:'0 0 12px'}}>
          <div className="text-xs text-hint uppercase tracking-wider" style={{margin : '0 0 12px'}}>💡 Tips</div>
          <div className="flex flex-col gap-2">
            {[
              { tip:'Price clearly likho — buyers seedha message karte hain', icon:'💰' },
              { tip:'Available/Unavailable toggle update karte raho', icon:'✅' },
              { tip:'Regular posts se followers badhte hain', icon:'📈' },
              { tip:'Stories dalte raho — 24 ghante mein expire hoti hain', icon:'⚡' },
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-3 bg-surf border border-theme rounded-xl px-3 py-2.5">
                <span className="text-base flex-shrink-0">{t.icon}</span>
                <span className="text-xs text-sub leading-relaxed">{t.tip}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4">
          <div className="text-xs text-hint uppercase tracking-wider" style={{margin : '0 0 12px'}}>Recent Posts Performance</div>
          <div className="bg-surf border border-theme rounded-2xl px-3">
            {loading ? (
              <div className="py-8 text-center text-hint text-sm">Loading...</div>
            ) : posts.length === 0 ? (
              <div className="py-8 text-center text-hint"><div className="text-3xl mb-2">📭</div><div className="text-sm">Is period mein koi post nahi</div></div>
            ) : posts.map(post => <PostRow key={post.id} post={post} />)}
          </div>
        </div>
      </div>
    </Layout>
  )
}
