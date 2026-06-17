import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const PRODUCT_CATEGORIES = {
  saree: {
    label: 'Saree & Textile', emoji: '🥻',
    subcategories: ['Bandhani', 'Patola', 'Silk', 'Cotton', 'Georgette', 'Chiffon', 'Linen', 'Net', 'Other'],
    units: ['piece', 'meter', 'set'],
  },
  clothing: {
    label: 'Clothing & Dress', emoji: '👗',
    subcategories: ['Kurti', 'Suit', 'Lehenga', 'Salwar', 'Dupatta', 'Blouse', 'Kids Wear', 'Men Wear', 'Other'],
    units: ['piece', 'set', 'dozen'],
  },
  textile: {
    label: 'Fabric & Material', emoji: '🧵',
    subcategories: ['Satin', 'Bandhani Material', 'Cotton Fabric', 'Silk Fabric', 'Embroidery Work', 'Lace', 'Other'],
    units: ['meter', 'piece', 'kg'],
  },
  food: {
    label: 'Homemade Food', emoji: '🍱',
    subcategories: ['Tiffin', 'Pickle', 'Papad', 'Masala', 'Snacks', 'Namkeen', 'Farsan', 'Dry Fruits', 'Other'],
    units: ['kg', 'gram', 'piece', 'box', 'packet', 'dozen'],
  },
  sweets: {
    label: 'Mithai & Sweets', emoji: '🍬',
    subcategories: ['Ladoo', 'Barfi', 'Halwa', 'Chakli', 'Mathiya', 'Ghughra', 'Mohanthal', 'Other'],
    units: ['kg', 'gram', 'piece', 'box', 'dozen'],
  },
  cake: {
    label: 'Cakes & Bakery', emoji: '🎂',
    subcategories: ['Birthday Cake', 'Wedding Cake', 'Cupcake', 'Brownie', 'Cookie', 'Bread', 'Muffin', 'Other'],
    units: ['kg', 'piece', 'dozen', 'box'],
  },
  jewellery: {
    label: 'Jewellery', emoji: '💍',
    subcategories: ['Necklace', 'Earrings', 'Bangles', 'Ring', 'Bracelet', 'Anklet', 'Maang Tikka', 'Set', 'Other'],
    units: ['piece', 'set', 'pair', 'dozen'],
  },
  beauty: {
    label: 'Beauty & Skincare', emoji: '🧴',
    subcategories: ['Face Pack', 'Hair Oil', 'Soap', 'Lip Balm', 'Body Butter', 'Scrub', 'Serum', 'Other'],
    units: ['piece', 'ml', 'gram', 'set'],
  },
  handicraft: {
    label: 'Handicraft & Art', emoji: '🏺',
    subcategories: ['Pottery', 'Painting', 'Embroidery', 'Crochet', 'Candle', 'Resin Art', 'Clay Work', 'Other'],
    units: ['piece', 'set', 'dozen'],
  },
  other: {
    label: 'Other', emoji: '🛍️',
    subcategories: ['Other'],
    units: ['piece', 'kg', 'set', 'box'],
  },
}

const ALL_UNITS = ['piece', 'kg', 'gram', 'meter', 'ml', 'liter', 'set', 'pair', 'dozen', 'box', 'packet']

function Toggle({ value, onChange, label, sublabel }) {
  return (
    <div className="flex items-center justify-between" style={{padding:'12px 16px'}}>
      <div>
        <div className="text-sm text-white font-medium">{label}</div>
        {sublabel && <div className="text-xs text-white/40">{sublabel}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-[#f5a623]' : 'bg-white/20'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${value ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

export default function NewPostModal({ onClose, onPosted }) {
  const { user, profile } = useAuth()
  const fileRef = useRef()
  const recognitionRef = useRef(null)

  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [caption, setCaption] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('piece')
  const [minOrder, setMinOrder] = useState('1')
  const [stockAvailable, setStockAvailable] = useState(true)
  const [deliveryAvailable, setDeliveryAvailable] = useState(true)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const textareaRef = useRef(null)

  const IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const canPost = profile?.plan === 'premium' || (profile?.post_count ?? 0) < 10
  const selectedCat = PRODUCT_CATEGORIES[category]

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Image 5MB se chhoti honi chahiye'); return }
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  function startVoice() {
    // iOS pe native keyboard mic use karo
    if (IS_IOS) {
      textareaRef.current?.focus()
      setShowIOSHint(true)
      setTimeout(() => setShowIOSHint(false), 4000)
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError('Voice support nahi hai is browser mein'); return }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    try {
      const recognition = new SR()
      recognitionRef.current = recognition
      recognition.lang = 'hi-IN'
      recognition.continuous = false
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => setListening(true)

      recognition.onresult = (e) => {
        let transcript = ''
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript
        }
        setCaption(p => p ? p + ' ' + transcript : transcript)
      }

      recognition.onerror = (e) => {
        console.log('Voice error:', e.error)
        setListening(false)
        if (e.error === 'not-allowed') {
          setError('Microphone permission do — Settings → Safari → Microphone → Allow')
        }
      }

      recognition.onend = () => setListening(false)
      recognition.start()

    } catch (err) {
      console.log('Voice exception:', err)
      setListening(false)
    }
  }

  function goNext() {
    setError('')
    if (step === 1) {
      if (!image) { setError('Product ki photo lagao'); return }
      if (!productName.trim()) { setError('Product ka naam daalo'); return }
      if (!category) { setError('Category chuno'); return }
    }
    if (step === 2) {
      if (!caption.trim()) { setError('Description zaroori hai'); return }
    }
    setStep(s => s + 1)
  }

  async function handlePost() {
    if (!canPost) { setError('Free plan limit ho gayi! Premium lo'); return }
    setLoading(true)
    setError('')
    try {
      const ext = image.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('product-images').upload(fileName, image, { upsert: false })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images').getPublicUrl(fileName)

      const { error: postError } = await supabase.from('posts').insert({
        seller_id:          user.id,
        image_url:          publicUrl,
        product_name:       productName.trim(),
        category:           category,
        subcategory:        subcategory || null,
        caption:            caption.trim(),
        price:              price.trim() || null,
        unit:               unit,
        min_order:          parseInt(minOrder) || 1,
        stock_available:    stockAvailable,
        delivery_available: deliveryAvailable,
        available:          stockAvailable,
        like_count:         0,
        comment_count:      0,
        created_at:         new Date().toISOString(),
      })
      if (postError) throw postError

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
      <div className="bg-[#1a1035] w-full max-w-sm rounded-t-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between pb-3 flex-shrink-0" style={{padding:'12px 16px'}}>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => { setStep(s => s - 1); setError('') }}
                className="text-white/50 hover:text-white text-lg">←</button>
            )}
            <div>
              <h2 className="text-base font-semibold text-white">Naya Product</h2>
              <p className="text-[10px] text-white/40">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white text-xl">✕</button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 flex-shrink-0" style={{padding:'12px 16px', margin:'0 0 12px'}}>
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-[#f5a623]' : 'bg-white/10'}`} />
          ))}
        </div>

        {/* Free plan badge */}
        {profile?.plan !== 'premium' && (
          <div className=" bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-xl px-3 py-2 flex items-center justify-between flex-shrink-0" style={{padding:'12px 16px', margin:'0 16px 12px'}}>
            <span className="text-xs text-[#f5a623]">Free: {10 - (profile?.post_count ?? 0)} posts baaki</span>
            <button className="text-xs bg-[#f5a623] text-white rounded-full" style={{padding:'4px 8px'}}>Upgrade</button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4" style={{padding:'12px 16px'}}>

          {/* ── STEP 1: Photo + Basic ── */}
          {step === 1 && (
            <>
              {/* Image picker */}
              <div
                onClick={() => fileRef.current?.click()}
                className={`w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden h-48 ${
                  imagePreview ? 'border-transparent' : 'border-white/20 hover:border-[#f5a623]/50'
                }`}
                style={{margin:'0 0 12px'}}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Product" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="text-4xl mb-2">📷</span>
                    <span className="text-sm text-white/50">Product ki photo lagao *</span>
                    <span className="text-xs text-white/30 mt-1">Tap to select</span>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {imagePreview && (
                <button onClick={() => { setImage(null); setImagePreview(null) }}
                  className="text-xs text-white/40 hover:text-white/70">← Photo badlo</button>
              )}

              {/* Product name */}
              <div style={{margin :'0 0 12px'}}>
                <label className="text-xs text-white/50 block" style={{margin: '0 0 12px'}}>Product ka naam *</label>
                <input
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="Jaise: Bandhani Saree, Chocolate Cake..."
                  className="w-full bg-white/10 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30"
                  style={{padding:'4px 8px'}}
                />
              </div>

              {/* Category grid */}
              <div style={{margin :'0 0 12px'}}>
                <label className="text-xs text-white/50 block" style={{margin :'0 0 12px'}}>Category *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PRODUCT_CATEGORIES).map(([key, cat]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setCategory(key); setSubcategory(''); setUnit(cat.units[0]) }}
                      className={`flex items-center gap-2 rounded-xl border text-left transition-all ${
                        category === key
                          ? 'border-[#f5a623] bg-[#f5a623]/10 text-white'
                          : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                      }`}
                      style={{padding:'4px 8px'}}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-xs font-medium leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategory chips */}
              {selectedCat && (
                <div>
                  <label className="text-xs text-white/50 mb-2 block">Sub-category</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCat.subcategories.map(sub => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSubcategory(sub === subcategory ? '' : sub)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                          subcategory === sub
                            ? 'border-[#f5a623] bg-[#f5a623]/20 text-[#f5a623]'
                            : 'border-white/10 text-white/50 hover:border-white/30'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: Description + Toggles ── */}
          {step === 2 && (
            <>
              {/* Mini summary */}
              <div className="bg-white/5 rounded-xl flex items-center gap-3" style={{padding:'12px 16px'}}>
                {imagePreview && <img src={imagePreview} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{productName}</div>
                  <div className="text-xs text-white/40">{selectedCat?.emoji} {selectedCat?.label}{subcategory ? ` · ${subcategory}` : ''}</div>
                </div>
              </div>

              {/* Description */}
              <div style={{margin: '12px 0'}}>
                <label className="text-xs text-white/50 block" style={{margin:'0 0 12px'}}>Description *</label>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Product ke baare mein detail mein batao — size, color, material, occasion..."
                    rows={4}
                    className="w-full bg-white/10 border border-white/10 rounded-xl pr-12 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30 resize-none"
                    style={{padding:'12px 16px'}}
                  />
                  <button
                    type="button"
                    onClick={startVoice}
                    className={`absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      listening ? 'bg-red-500 animate-pulse' : 'bg-[#f5a623]/20 hover:bg-[#f5a623]/40'
                    }`}
                  >
                    <span className="text-sm">{listening ? '⏺' : '🎙️'}</span>
                  </button>
                </div>
                {/* iOS animated hint */}
                {showIOSHint && (
                  <div className="flex flex-col items-end mt-1">
                    <div className="flex items-center gap-2 bg-[#1a1035] border border-[#f5a623]/40 rounded-2xl px-3 py-2 shadow-xl self-end">
                      <span className="text-sm">🎙️</span>
                      <span className="text-xs text-white/80 whitespace-nowrap">Keyboard pe mic dabao</span>
                    </div>
                    <div className="animate-bounce text-[#f5a623] text-xl mt-1 mr-2">↓</div>
                  </div>
                )}
                <p className="text-[10px] text-white/30 mt-1">
                  {IS_IOS ? '📱 Mic tap karo → keyboard pe 🎙️ dabao' : '🎙️ Mic tap karo — Hindi mein bol sakte ho'}
                </p>
              </div>

              {/* Toggles */}
              <div className="bg-white/5 rounded-xl px-4 divide-y divide-white/5">
                <Toggle value={stockAvailable} onChange={setStockAvailable}
                  label="Stock available hai?" sublabel="Buyers ko pata chalega" />
                <Toggle value={deliveryAvailable} onChange={setDeliveryAvailable}
                  label="Delivery available hai?" sublabel="Ghar pe bhej sakte ho?" />
              </div>
            </>
          )}

          {/* ── STEP 3: Pricing ── */}
          {step === 3 && (
            <>
              {/* Mini summary */}
              <div className="bg-white/5 rounded-xl flex items-center gap-3" style={{padding:'12px 16px', margin:' 0 0 12px'}}>
                {imagePreview && <img src={imagePreview} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{productName}</div>
                  <div className="text-xs text-white/40">{selectedCat?.emoji} {subcategory || selectedCat?.label}</div>
                </div>
              </div>

              {/* Price + Unit */}
              <div style={{margin:'0 0 12px'}}>
                <label className="text-xs text-white/50 block" style={{margin:'0 0 12px'}}>Price</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
                    <input
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="500"
                      type="text"
                      inputMode="numeric"
                      className="w-full bg-white/10 border border-white/10 rounded-xl pl-8 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30"
                      style={{padding:'4px 8px'}}
                    />
                  </div>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="bg-white/10 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#f5a623] transition-colors"
                    style={{padding:'4px 8px'}}
                  >
                    {(selectedCat?.units || ALL_UNITS).map(u => (
                      <option key={u} value={u} className="bg-[#1a1035]">/ {u}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-white/30 mt-1">Jaise: ₹500/piece ya ₹200/kg</p>
              </div>

              {/* Min order */}
              <div style={{margin:'0 0 12px'}}>
                <label className="text-xs text-white/50 block" style={{margin:'0 0 12px'}}>Minimum order</label>
                <div className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-xl" style={{padding:'12px 16px'}}>
                  <button
                    type="button"
                    onClick={() => setMinOrder(m => String(Math.max(1, parseInt(m) - 1)))}
                    className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-lg hover:bg-white/20"
                  >−</button>
                  <span className="flex-1 text-center text-white font-semibold">{minOrder} {unit}</span>
                  <button
                    type="button"
                    onClick={() => setMinOrder(m => String(parseInt(m) + 1))}
                    className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-lg hover:bg-white/20"
                  >+</button>
                </div>
              </div>

              {/* Summary card */}
              <div className="bg-[#f5a623]/5 border border-[#f5a623]/20 rounded-xl space-y-2" style={{padding:'12px 16px'}}>
                <div className="text-xs text-[#f5a623] font-medium" style={{margin:'0 0 12px'}}>Product Summary</div>
                {[
                  ['Naam', productName],
                  ['Category', `${selectedCat?.emoji} ${subcategory || selectedCat?.label}`],
                  ['Price', price ? `₹${price}/${unit}` : 'Price nahi diya'],
                  ['Min Order', `${minOrder} ${unit}`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-xs" style={{margin:'0 0 5px'}}>
                    <span className="text-white/40">{label}</span>
                    <span className="text-white">{val}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs" style={{margin:'0 0 12px'}}>
                  <span className="text-white/40">Stock</span>
                  <span className={stockAvailable ? 'text-green-400' : 'text-red-400'}>
                    {stockAvailable ? '✓ Available' : '✗ Out of stock'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Delivery</span>
                  <span className={deliveryAvailable ? 'text-green-400' : 'text-white/40'}>
                    {deliveryAvailable ? '✓ Available' : '✗ Pickup only'}
                  </span>
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 flex-shrink-0" style={{padding:'12px 16px'}}>
          {step < 3 ? (
            <button
              onClick={goNext}
              className="w-full bg-[#f5a623] text-white font-semibold rounded-xl text-sm hover:bg-[#e09520] transition-colors"
              style={{padding:'4px 8px'}}
            >
              Aage → (Step {step + 1} of 3)
            </button>
          ) : (
            <button
              onClick={handlePost}
              disabled={loading || !canPost}
              className="w-full bg-[#f5a623] text-white font-semibold rounded-xl text-sm hover:bg-[#e09520] transition-colors disabled:opacity-50"
              style={{padding:'4px 8px'}}
            >
              {loading ? 'Post ho raha hai...' : '🚀 Product Post Karo!'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
