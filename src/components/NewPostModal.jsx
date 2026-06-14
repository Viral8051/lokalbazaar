import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ── Category + Subcategory + Units data ───────────────────────
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

// ── Toggle Switch ──────────────────────────────────────────────
function Toggle({ value, onChange, label, sublabel }) {
  return (
    <div className="flex items-center justify-between py-2">
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

// ── Select Field ───────────────────────────────────────────────
function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1 block">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff60' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
      >
        <option value="" className="bg-[#1a1035]">{placeholder}</option>
        {options.map(o => (
          <option key={o} value={o} className="bg-[#1a1035]">{o}</option>
        ))}
      </select>
    </div>
  )
}

// ── Main Modal ─────────────────────────────────────────────────
export default function NewPostModal({ onClose, onPosted }) {
  const { user, profile } = useAuth()
  const fileRef = useRef()

  // Image
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Product fields
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [caption, setCaption] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('piece')
  const [minOrder, setMinOrder] = useState('1')
  const [stockAvailable, setStockAvailable] = useState(true)
  const [deliveryAvailable, setDeliveryAvailable] = useState(true)

  // UI
  const [step, setStep] = useState(1) // 1=photo+basic, 2=details, 3=pricing
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)

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
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (listening) return
    try {
      const r = new SR()
      r.lang = 'hi-IN'
      r.interimResults = false
      r.onstart = () => setListening(true)
      r.onresult = (e) => setCaption(p => p ? p + ' ' + e.results[0][0].transcript : e.results[0][0].transcript)
      r.onerror = () => setListening(false)
      r.onend = () => setListening(false)
      r.start()
    } catch { setListening(false) }
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
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="text-white/50 hover:text-white text-lg">←</button>
            )}
            <div>
              <h2 className="text-base font-semibold text-white">Naya Product</h2>
              <p className="text-[10px] text-white/40">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white text-xl">✕</button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 px-5 mb-4 flex-shrink-0">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-[#f5a623]' : 'bg-white/10'}`} />
          ))}
        </div>

        {/* Free plan badge */}
        {profile?.plan !== 'premium' && (
          <div className="mx-5 mb-3 bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-xl px-3 py-2 flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-[#f5a623]">Free: {10 - (profile?.post_count ?? 0)} posts baaki</span>
            <button className="text-xs bg-[#f5a623] text-white px-3 py-1 rounded-full">Upgrade</button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">

          {/* ── STEP 1: Photo + Basic Info ── */}
          {step === 1 && (
            <>
              {/* Image picker */}
              <div
                onClick={() => fileRef.current?.click()}
                className={`w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                  imagePreview ? 'border-transparent h-48' : 'border-white/20 hover:border-[#f5a623]/50 h-48'
                }`}
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
              <div>
                <label className="text-xs text-white/50 mb-1 block">Product ka naam *</label>
                <input
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="Jaise: Bandhani Saree, Chocolate Cake..."
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30"
                />
              </div>

              {/* Category */}
              <SelectField
                label="Category *"
                value={category}
                onChange={(val) => { setCategory(val); setSubcategory('') }}
                options={Object.entries(PRODUCT_CATEGORIES).map(([k, v]) => `${v.emoji} ${v.label}|${k}`).map(x => x.split('|')[0])}
                placeholder="Category chuno"
              />
              {/* Fix: category value mapping */}
              <div className="hidden">
                <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory('') }}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5a623]">
                  <option value="">Category chuno *</option>
                  {Object.entries(PRODUCT_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key} className="bg-[#1a1035]">{cat.emoji} {cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Real category select */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Category *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PRODUCT_CATEGORIES).map(([key, cat]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setCategory(key); setSubcategory('') }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                        category === key
                          ? 'border-[#f5a623] bg-[#f5a623]/10 text-white'
                          : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                      }`}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-xs font-medium leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategory */}
              {selectedCat && (
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Sub-category</label>
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

          {/* ── STEP 2: Description ── */}
          {step === 2 && (
            <>
              <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                {imagePreview && <img src={imagePreview} className="w-12 h-12 rounded-lg object-cover" />}
                <div>
                  <div className="text-sm font-medium text-white">{productName}</div>
                  <div className="text-xs text-white/40">{selectedCat?.emoji} {selectedCat?.label}{subcategory ? ` · ${subcategory}` : ''}</div>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Description *</label>
                <div className="relative">
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Product ke baare mein detail mein batao — size, color, material, occasion..."
                    rows={4}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30 resize-none"
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
                <p className="text-[10px] text-white/30 mt-1">Mic tap karo — Hindi mein bol sakte ho</p>
              </div>

              {/* Stock & Delivery toggles */}
              <div className="bg-white/5 rounded-xl px-4 divide-y divide-white/5">
                <Toggle
                  value={stockAvailable}
                  onChange={setStockAvailable}
                  label="Stock available hai?"
                  sublabel="Buyers ko pata chalega"
                />
                <Toggle
                  value={deliveryAvailable}
                  onChange={setDeliveryAvailable}
                  label="Delivery available hai?"
                  sublabel="Ghar pe bhej sakte ho?"
                />
              </div>
            </>
          )}

          {/* ── STEP 3: Pricing ── */}
          {step === 3 && (
            <>
              <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                {imagePreview && <img src={imagePreview} className="w-12 h-12 rounded-lg object-cover" />}
                <div>
                  <div className="text-sm font-medium text-white">{productName}</div>
                  <div className="text-xs text-white/40">{selectedCat?.emoji} {subcategory || selectedCat?.label}</div>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Price</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
                    <input
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="500"
                      type="text"
                      className="w-full bg-white/10 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30"
                    />
                  </div>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="bg-white/10 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors"
                  >
                    {(selectedCat?.units || ALL_UNITS).map(u => (
                      <option key={u} value={u} className="bg-[#1a1035]">/ {u}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-white/30 mt-1">Jaise: ₹500/piece ya ₹200/kg</p>
              </div>

              {/* Min order */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Minimum order</label>
                <div className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-xl px-4 py-3">
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

              {/* Summary */}
              <div className="bg-[#f5a623]/5 border border-[#f5a623]/20 rounded-xl p-4 space-y-2">
                <div className="text-xs text-[#f5a623] font-medium mb-2">Product Summary</div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Naam</span>
                  <span className="text-white">{productName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Category</span>
                  <span className="text-white">{selectedCat?.emoji} {subcategory || selectedCat?.label}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Price</span>
                  <span className="text-white">{price ? `₹${price}/${unit}` : 'Price nahi diya'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Min Order</span>
                  <span className="text-white">{minOrder} {unit}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Stock</span>
                  <span className={stockAvailable ? 'text-green-400' : 'text-red-400'}>{stockAvailable ? '✓ Available' : '✗ Out of stock'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Delivery</span>
                  <span className={deliveryAvailable ? 'text-green-400' : 'text-white/40'}>{deliveryAvailable ? '✓ Available' : '✗ Pickup only'}</span>
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer button */}
        <div className="px-5 py-4 border-t border-white/10 flex-shrink-0">
          {step < 3 ? (
            <button
              onClick={goNext}
              className="w-full bg-[#f5a623] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#e09520] transition-colors"
            >
              Aage → (Step {step + 1} of 3)
            </button>
          ) : (
            <button
              onClick={handlePost}
              disabled={loading || !canPost}
              className="w-full bg-[#f5a623] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#e09520] transition-colors disabled:opacity-50"
            >
              {loading ? 'Post ho raha hai...' : '🚀 Product Post Karo!'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
