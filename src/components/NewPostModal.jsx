import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function NewPostModal({ onClose, onPosted }) {
  const { user, profile } = useAuth()
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [price, setPrice] = useState('')
  const [available, setAvailable] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const fileRef = useRef()

  // Check post limit for free plan
  const canPost = profile?.plan === 'premium' || (profile?.post_count ?? 0) < 10

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Image 5MB se chhoti honi chahiye'); return }
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  function startVoiceCaption() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Yeh browser voice support nahi karta'); return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'hi-IN' // Hindi — also works for Gujarati roughly
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript
      setCaption(prev => prev ? prev + ' ' + text : text)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
  }

  async function handlePost() {
    if (!image) { setError('Photo lagao product ki'); return }
    if (!caption.trim()) { setError('Thoda description likho ya bolo'); return }
    if (!canPost) { setError('Free plan limit ho gayi! Premium lo unlimited posts ke liye'); return }

    setLoading(true)
    setError('')

    try {
      // 1. Upload image to Supabase Storage
      const ext = image.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, image, { upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      // 2. Insert post record
      const { error: postError } = await supabase.from('posts').insert({
        seller_id: user.id,
        image_url: publicUrl,
        caption: caption.trim(),
        price: price.trim() || null,
        available,
        like_count: 0,
        comment_count: 0,
        created_at: new Date().toISOString(),
      })

      if (postError) throw postError

      // 3. Update seller's post count
      await supabase.from('profiles')
        .update({ post_count: (profile.post_count ?? 0) + 1 })
        .eq('id', user.id)

      onPosted?.()
      onClose?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
      <div className="bg-[#1a1035] w-full max-w-sm rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Naya product add karo</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Free plan badge */}
        {profile?.plan !== 'premium' && (
          <div className="bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-xl p-3 mb-4 flex items-center justify-between">
            <span className="text-xs text-[#f5a623]">Free plan: {10 - (profile?.post_count ?? 0)} posts baaki</span>
            <button className="text-xs bg-[#f5a623] text-white px-3 py-1 rounded-full font-medium">Upgrade</button>
          </div>
        )}

        {/* Image picker */}
        <div
          onClick={() => fileRef.current?.click()}
          className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors mb-4 ${
            imagePreview ? 'border-transparent p-0' : 'border-white/20 hover:border-[#f5a623]/50'
          }`}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Product" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <>
              <span className="text-4xl mb-2">📷</span>
              <span className="text-sm text-white/50">Product ki photo lagao</span>
              <span className="text-xs text-white/30 mt-1">Tap to select</span>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

        {imagePreview && (
          <button
            onClick={() => { setImage(null); setImagePreview(null) }}
            className="text-xs text-white/40 hover:text-white/70 mb-3 block"
          >
            ← Change photo
          </button>
        )}

        {/* Caption with voice */}
        <label className="text-xs text-white/50 mb-1 block">Description *</label>
        <div className="relative mb-3">
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Product ke baare mein batao... ya mic tap karo bolo"
            rows={3}
            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30 resize-none"
          />
          <button
            onClick={startVoiceCaption}
            className={`absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              listening ? 'bg-red-500 animate-pulse' : 'bg-[#f5a623]/20 hover:bg-[#f5a623]/40'
            }`}
            title="Voice se bolo"
          >
            <span className="text-sm">{listening ? '⏺' : '🎙️'}</span>
          </button>
        </div>

        {/* Price */}
        <label className="text-xs text-white/50 mb-1 block">Price (optional)</label>
        <input
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder="Jaise: ₹500 ya ₹200-₹800"
          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30 mb-4"
        />

        {/* Available toggle */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-sm text-white font-medium">Available hai?</div>
            <div className="text-xs text-white/40">Buyers ko pata chalega stock ka</div>
          </div>
          <button
            onClick={() => setAvailable(a => !a)}
            className={`w-12 h-6 rounded-full transition-colors relative ${available ? 'bg-[#f5a623]' : 'bg-white/20'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${available ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        {error && <p className="text-red-400 text-xs mb-3 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

        <button
          onClick={handlePost}
          disabled={loading || !canPost}
          className="w-full bg-[#f5a623] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#e09520] transition-colors disabled:opacity-50"
        >
          {loading ? 'Post ho raha hai...' : 'Post Karo 🚀'}
        </button>
      </div>
    </div>
  )
}
