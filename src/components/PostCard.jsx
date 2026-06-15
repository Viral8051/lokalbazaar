import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function PostCard({ post, onSellerClick }) {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [liked, setLiked]         = useState(false)
  const [likeCount, setLikeCount] = useState(post.like_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments]   = useState([])
  const [commentText, setCommentText] = useState('')

  const seller   = post.profiles
  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '?'

  async function toggleLike() {
    if (!user) return
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
      await supabase.from('posts').update({ like_count: likeCount - 1 }).eq('id', post.id)
      setLiked(false); setLikeCount(c => c - 1)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
      await supabase.from('posts').update({ like_count: likeCount + 1 }).eq('id', post.id)
      setLiked(true); setLikeCount(c => c + 1)
    }
  }

  async function loadComments() {
    const { data } = await supabase
      .from('comments').select(`*, profiles!comments_user_id_fkey(owner_name, shop_name)`)
      .eq('post_id', post.id).order('created_at', { ascending: true })
    setComments(data || [])
  }

  async function submitComment() {
    if (!commentText.trim() || !user) return
    await supabase.from('comments').insert({ post_id: post.id, user_id: user.id, text: commentText.trim() })
    setCommentText('')
    loadComments()
  }

  function handleComments() {
    setShowComments(s => { if (!s) loadComments(); return !s })
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 18,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 8px' }}>
        <div onClick={() => onSellerClick?.(post.seller_id)} style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--bg-surf)', border: '1.5px solid #FF4C29',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: '#FF4C29',
          cursor: 'pointer', flexShrink: 0,
        }}>
          {initials(seller?.shop_name)}
        </div>
        <div style={{ flex: 1 }}>
          <div onClick={() => onSellerClick?.(post.seller_id)} style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>
            {seller?.shop_name || 'Seller'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 1 }}>
            {seller?.city}{seller?.category ? ` · ${seller.category}` : ''}
          </div>
        </div>
        {seller?.plan === 'premium' && (
          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 6, background: 'rgba(255,76,41,0.12)', color: '#FF4C29', border: '1px solid rgba(255,76,41,0.2)', fontWeight: 700 }}>
            ✦ Pro
          </span>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <img src={post.image_url} alt={post.product_name || post.caption}
          style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
      )}

      {/* Body */}
      <div style={{ padding: '10px 14px' }}>
        {/* Tags */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
          {post.category && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#FF4C29', color: 'white', fontWeight: 600 }}>
              {post.subcategory || post.category}
            </span>
          )}
          {post.stock_available !== false && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(52,211,153,0.12)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
              ✓ In Stock
            </span>
          )}
          {post.delivery_available && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-surf)', color: 'var(--text-sub)', border: '1px solid var(--border)' }}>
              🚚 Delivery
            </span>
          )}
        </div>

        {/* Product name */}
        {post.product_name && (
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
            {post.product_name}
          </div>
        )}

        {/* Caption */}
        <div style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.5, marginBottom: 8 }}>
          {post.caption}
        </div>

        {/* Price + min order */}
        {post.price && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#FF4C29' }}>
              ₹{post.price}
              {post.unit && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-hint)' }}>/{post.unit}</span>}
            </div>
            {post.min_order > 1 && (
              <span style={{ fontSize: 10, color: 'var(--text-hint)' }}>Min: {post.min_order} {post.unit}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, padding: '0 14px 14px' }}>
        <button onClick={toggleLike} style={{
          flex: 1, padding: '9px', borderRadius: 12, border: '1px solid var(--border)',
          background: liked ? 'rgba(255,76,41,0.1)' : 'var(--bg-surf)',
          color: liked ? '#FF4C29' : 'var(--text-sub)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {liked ? '❤️' : '♡'} {likeCount}
        </button>
        <button onClick={handleComments} style={{
          flex: 1, padding: '9px', borderRadius: 12, border: '1px solid var(--border)',
          background: 'var(--bg-surf)', color: 'var(--text-sub)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          💬 {post.comment_count || 0}
        </button>
        <button onClick={() => navigate(`/chat/${post.seller_id}`)} style={{
          flex: 2, padding: '9px', borderRadius: 12, border: 'none',
          background: '#FF4C29', color: 'white',
          fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Message Seller
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px 14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {comments.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-hint)', textAlign: 'center' }}>Pehla comment karo!</p>
            ) : comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  background: 'var(--bg-surf)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#FF4C29',
                }}>
                  {initials(c.profiles?.shop_name || c.profiles?.owner_name)}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginRight: 6 }}>
                    {c.profiles?.shop_name || c.profiles?.owner_name}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>{c.text}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
              placeholder="Comment karo..."
              style={{
                flex: 1, background: 'var(--bg-surf)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '8px 12px', color: 'var(--text)',
                fontSize: 12, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button onClick={submitComment} style={{
              background: '#FF4C29', color: 'white', border: 'none',
              borderRadius: 10, padding: '8px 14px', fontSize: 12,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>Send</button>
          </div>
        </div>
      )}
    </div>
  )
}
