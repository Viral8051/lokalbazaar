import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'

// Story viewer modal
function StoryViewer({ stories, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef()

  const story = stories[current]
  const DURATION = 5000 // 5 seconds per story

  useEffect(() => {
    setProgress(0)
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          goNext()
          return 0
        }
        return p + (100 / (DURATION / 100))
      })
    }, 100)
    return () => clearInterval(intervalRef.current)
  }, [current])

  // Count view
  useEffect(() => {
    if (story?.id) {
      supabase.from('stories').update({ views: (story.views || 0) + 1 }).eq('id', story.id)
    }
  }, [story?.id])

  function goNext() {
    if (current < stories.length - 1) setCurrent(c => c + 1)
    else onClose()
  }

  function goPrev() {
    if (current > 0) setCurrent(c => c - 1)
  }

  if (!story) return null

  const timeLeft = () => {
    const diff = new Date(story.expires_at) - Date.now()
    const h = Math.floor(diff / 3600000)
    return h > 0 ? `${h}h baaki` : 'Expire hone wali'
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col max-w-sm mx-auto">
      {/* Progress bars */}
      <div className="flex gap-1 px-3 pt-10 pb-2 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{ width: i < current ? '100%' : i === current ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-12 left-0 right-0 z-10 flex items-center gap-2 px-3">
        <Avatar name={story.profiles?.shop_name} size="sm" />
        <div className="flex-1">
          <div className="text-white text-xs font-semibold">{story.profiles?.shop_name}</div>
          <div className="text-white/50 text-[10px]">{timeLeft()}</div>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white text-xl">✕</button>
      </div>

      {/* Image */}
      <div className="flex-1 relative">
        <img src={story.image_url} alt="" className="w-full h-full object-cover" />

        {/* Tap zones */}
        <div className="absolute inset-0 flex">
          <div className="flex-1" onClick={goPrev} />
          <div className="flex-1" onClick={goNext} />
        </div>
      </div>

      {/* Caption */}
      {story.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pt-8 pb-6">
          <p className="text-white text-sm leading-relaxed">{story.caption}</p>
          <div className="text-white/40 text-xs mt-1">👁 {story.views || 0} views</div>
        </div>
      )}
    </div>
  )
}

// Add story modal
function AddStoryModal({ onClose, onAdded }) {
  const { user } = useAuth()
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const fileRef = useRef()

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  function startVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'hi-IN'
    recognition.interimResults = false
    recognition.onstart = () => setListening(true)
    recognition.onresult = (e) => setCaption(e.results[0][0].transcript)
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
  }

  async function upload() {
    if (!image) return
    setLoading(true)
    try {
      const ext = image.name.split('.').pop()
      const fileName = `stories/${user.id}/${Date.now()}.${ext}`
      await supabase.storage.from('product-images').upload(fileName, image)
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)

      await supabase.from('stories').insert({
        seller_id: user.id,
        image_url: publicUrl,
        caption: caption.trim() || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      onAdded?.()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
      <div className="bg-[#1a1035] w-full max-w-sm rounded-t-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Nayi Story</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl">✕</button>
        </div>

        {/* Image picker */}
        <div
          onClick={() => fileRef.current?.click()}
          className={`w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer mb-4 transition-colors ${
            preview ? 'border-transparent h-56' : 'border-white/20 hover:border-[#f5a623]/50 h-40'
          }`}
        >
          {preview
            ? <img src={preview} alt="" className="w-full h-full object-cover rounded-xl" />
            : <>
                <span className="text-3xl mb-2">📸</span>
                <span className="text-sm text-white/50">Story ke liye photo chuno</span>
                <span className="text-xs text-white/30 mt-1">24 ghante mein expire hogi</span>
              </>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

        {/* Caption with voice */}
        <div className="relative mb-4">
          <input
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Kuch likho ya bolo... (optional)"
            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30"
          />
          <button
            onClick={startVoice}
            className={`absolute right-3 top-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              listening ? 'bg-red-500 animate-pulse' : 'bg-[#f5a623]/20 hover:bg-[#f5a623]/40'
            }`}
          >
            <span className="text-sm">{listening ? '⏺' : '🎙️'}</span>
          </button>
        </div>

        <button
          onClick={upload}
          disabled={loading || !image}
          className="w-full bg-[#f5a623] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#e09520] transition-colors disabled:opacity-50"
        >
          {loading ? 'Upload ho raha hai...' : 'Story Daalo 🚀'}
        </button>
      </div>
    </div>
  )
}

// Main Stories row component
export default function Stories({ showAdd = true }) {
  const { user } = useAuth()
  const [stories, setStories] = useState([]) // grouped by seller
  const [viewing, setViewing] = useState(null) // { stories, startIndex }
  const [showAdd_, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStories() }, [])

  async function fetchStories() {
    const { data } = await supabase
      .from('stories')
      .select(`*, profiles(shop_name, owner_name, city)`)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    // Group by seller
    const grouped = {}
    for (const story of (data || [])) {
      const sid = story.seller_id
      if (!grouped[sid]) grouped[sid] = { seller: story.profiles, sellerId: sid, stories: [] }
      grouped[sid].stories.push(story)
    }
    setStories(Object.values(grouped))
    setLoading(false)
  }

  function openStories(sellerGroup) {
    setViewing({ stories: sellerGroup.stories, startIndex: 0 })
  }

  if (loading) return null

  return (
    <>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-3">
        {/* Add story button */}
        {showAdd && user && (
          <div className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0" onClick={() => setShowAdd(true)}>
            <div className="w-14 h-14 rounded-full bg-white/5 border-2 border-dashed border-[#f5a623]/40 hover:border-[#f5a623] transition-colors flex items-center justify-center text-[#f5a623] text-2xl">
              +
            </div>
            <span className="text-[10px] text-white/40">Teri story</span>
          </div>
        )}

        {/* Seller stories */}
        {stories.map(group => (
          <div
            key={group.sellerId}
            onClick={() => openStories(group)}
            className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#f5a623] to-[#e8a598]">
              <div className="w-full h-full rounded-full bg-[#0f0a1e] flex items-center justify-center">
                <Avatar name={group.seller?.shop_name} size="sm" />
              </div>
            </div>
            <span className="text-[10px] text-white/50 w-14 text-center truncate">
              {group.seller?.shop_name?.split(' ')[0]}
            </span>
          </div>
        ))}

        {stories.length === 0 && !showAdd && (
          <div className="text-xs text-white/20 py-2">Abhi koi story nahi</div>
        )}
      </div>

      {/* Story viewer */}
      {viewing && (
        <StoryViewer
          stories={viewing.stories}
          startIndex={viewing.startIndex}
          onClose={() => setViewing(null)}
        />
      )}

      {/* Add story modal */}
      {showAdd_ && (
        <AddStoryModal
          onClose={() => setShowAdd(false)}
          onAdded={() => { fetchStories(); setShowAdd(false) }}
        />
      )}
    </>
  )
}
