import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import Badge from './Badge'

export default function PostCard({ post, onSellerClick }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.like_count || 0)
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  const seller = post.profiles

  function toggleLike() {
    setLiked(l => !l)
    setLikeCount(c => liked ? c - 1 : c + 1)
  }

  async function loadComments() {
    if (showComments) { setShowComments(false); return }
    setLoadingComments(true)
    const { data } = await supabase
      .from('comments')
      .select(`*, profiles(shop_name, owner_name)`)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
      .limit(20)
    setComments(data || [])
    setShowComments(true)
    setLoadingComments(false)
  }

  async function postComment() {
    if (!commentText.trim() || !user) return
    const text = commentText.trim()
    setCommentText('')
    const { data } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: user.id,
      text,
      created_at: new Date().toISOString(),
    }).select(`*, profiles(shop_name, owner_name)`).single()
    if (data) setComments(c => [...c, data])
  }

  const timeAgo = (d) => {
    const diff = (Date.now() - new Date(d)) / 1000
    if (diff < 60) return 'abhi'
    if (diff < 3600) return `${Math.floor(diff/60)}m`
    if (diff < 86400) return `${Math.floor(diff/3600)}h`
    return `${Math.floor(diff/86400)}d`
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Avatar name={seller?.shop_name} size="sm" onClick={() => onSellerClick?.(post.seller_id)} />
        <div className="flex-1 min-w-0">
          <div
            onClick={() => onSellerClick?.(post.seller_id)}
            className="text-sm font-medium text-white cursor-pointer hover:text-[#f5a623] transition-colors flex items-center gap-1.5"
          >
            <span className="truncate">{seller?.shop_name || 'Seller'}</span>
            {seller?.plan === 'premium' && <Badge label="✦ Pro" variant="premium" />}
          </div>
          <div className="text-[11px] text-white/40">{seller?.city} · {timeAgo(post.created_at)}</div>
        </div>
        {post.available !== false
          ? <Badge label="Available" variant="available" />
          : <Badge label="Unavailable" variant="unavailable" />
        }
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="w-full aspect-square bg-white/5">
          <img src={post.image_url} alt={post.caption} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 px-3 py-2">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1 text-sm transition-colors ${liked ? 'text-red-400' : 'text-white/50 hover:text-white'}`}
        >
          <span className="text-base">{liked ? '❤️' : '🤍'}</span>
          <span className="text-xs">{likeCount}</span>
        </button>
        <button onClick={loadComments} className="flex items-center gap-1 text-white/50 hover:text-white transition-colors">
          <span className="text-base">💬</span>
          <span className="text-xs">{post.comment_count || 0}</span>
        </button>
        <button
          onClick={() => navigate(`/chat/${post.seller_id}`)}
          className="ml-auto bg-[#f5a623] text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-[#e09520] transition-colors"
        >
          💬 Message
        </button>
      </div>

      {/* Caption */}
      <div className="px-3 pb-2">
        <p className="text-sm text-white leading-relaxed">
          <span className="font-medium text-white/80 mr-1">{seller?.shop_name}</span>
          {post.caption}
        </p>
        {post.price && <Badge label={post.price} variant="premium" className="mt-1" />}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-white/10 px-3 py-2">
          {loadingComments ? (
            <div className="text-xs text-white/30 py-1">Loading...</div>
          ) : comments.length === 0 ? (
            <div className="text-xs text-white/30 py-1">Pehla comment karo!</div>
          ) : (
            <div className="flex flex-col gap-1.5 mb-2">
              {comments.map(c => (
                <div key={c.id} className="text-xs text-white/70">
                  <span className="font-medium text-white/90 mr-1">{c.profiles?.shop_name || 'User'}</span>
                  {c.text}
                </div>
              ))}
            </div>
          )}
          {user && (
            <div className="flex items-center gap-2 mt-1">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && postComment()}
                placeholder="Comment karo..."
                className="flex-1 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white outline-none focus:border-[#f5a623] placeholder:text-white/30 transition-colors"
              />
              <button onClick={postComment} disabled={!commentText.trim()} className="text-[#f5a623] text-sm disabled:opacity-30">➤</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
