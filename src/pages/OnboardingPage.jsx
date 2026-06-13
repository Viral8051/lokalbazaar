import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = [
  { id: 'saree', label: 'Saree & Textile', emoji: '🥻' },
  { id: 'food', label: 'Homemade Food', emoji: '🍱' },
  { id: 'sweets', label: 'Mithai & Sweets', emoji: '🍬' },
  { id: 'handicraft', label: 'Handicraft', emoji: '🏺' },
  { id: 'jewellery', label: 'Jewellery', emoji: '💍' },
  { id: 'beauty', label: 'Beauty & Skincare', emoji: '🧴' },
  { id: 'clothing', label: 'Clothing', emoji: '👗' },
  { id: 'other', label: 'Other', emoji: '🛍️' },
]

export default function OnboardingPage() {
  const { user, fetchProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    shop_name: '',
    owner_name: '',
    category: '',
    city: 'Jamnagar',
    bio: '',
    is_seller: true,
  })

  function updateForm(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function finish() {
    if (!form.shop_name || !form.owner_name || !form.category) {
      setError('Sab fields bharo'); return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      ...form,
      post_count: 0,
      follower_count: 0,
      plan: 'free',
      created_at: new Date().toISOString(),
    })

    setLoading(false)
    if (error) { setError(error.message); return }
    await fetchProfile(user.id)
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-[#0f0a1e] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${step >= s ? 'bg-[#f5a623]' : 'bg-white/10'}`} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-white mb-1">Apni dukaan banao 🛍️</h2>
            <p className="text-sm text-white/50 mb-6">Thoda basic info chahiye</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Dukaan ka naam *</label>
                <input
                  value={form.shop_name}
                  onChange={e => updateForm('shop_name', e.target.value)}
                  placeholder="Jaise: Radha Sarees, Kiran Sweets..."
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Tumhara naam *</label>
                <input
                  value={form.owner_name}
                  onChange={e => updateForm('owner_name', e.target.value)}
                  placeholder="Full name"
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Sheher</label>
                <input
                  value={form.city}
                  onChange={e => updateForm('city', e.target.value)}
                  placeholder="Jamnagar"
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Bio (optional)</label>
                <textarea
                  value={form.bio}
                  onChange={e => updateForm('bio', e.target.value)}
                  placeholder="Apni dukaan ke baare mein thoda batao..."
                  rows={3}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30 resize-none"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!form.shop_name || !form.owner_name) { setError('Naam fields zaroori hain'); return }
                setError(''); setStep(2)
              }}
              className="w-full bg-[#f5a623] text-white font-semibold py-3 rounded-xl text-sm mt-6 hover:bg-[#e09520] transition-colors"
            >
              Aage →
            </button>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold text-white mb-1">Kya bechte ho? 🤔</h2>
            <p className="text-sm text-white/50 mb-6">Ek category chuno</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => updateForm('category', cat.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    form.category === cat.id
                      ? 'border-[#f5a623] bg-[#f5a623]/10 text-[#f5a623]'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30'
                  }`}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

            <button
              onClick={finish}
              disabled={loading || !form.category}
              className="w-full bg-[#f5a623] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#e09520] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Dukaan shuru karo! 🚀'}
            </button>

            <button onClick={() => setStep(1)} className="w-full text-center text-xs text-white/40 mt-3 hover:text-white/60 transition-colors">
              ← Wapas
            </button>
          </>
        )}
      </div>
    </div>
  )
}
