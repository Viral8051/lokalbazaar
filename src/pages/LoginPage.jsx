import { useState } from 'react'
import { supabase } from '../lib/supabase'
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

export default function LoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [pendingProfile, setPendingProfile] = useState({
    owner_name: '', shop_name: '', city: 'Jamnagar', bio: '', category: ''
  })

  function updateProfile(key, val) {
    setPendingProfile(p => ({ ...p, [key]: val }))
  }

  // Step 1 — Check email
  async function checkEmail() {
    setError('')
    if (!email.includes('@')) { setError('Valid email daalo'); return }
    setChecking(true)
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    setChecking(false)

    if (data) {
      // Purana user — seedha OTP
      await sendOTP()
    } else {
      // Naya user — pehle role chuno
      setStep('role')
    }
  }

  // Step 2 — Role select
  function selectRole(r) {
    setRole(r)
    if (r === 'buyer') {
      sendOTP('buyer')
    } else {
      setStep('details')
    }
  }

  // Step 3 — Seller details validate
  function goToCategory() {
    if (!pendingProfile.owner_name) { setError('Apna naam daalo'); return }
    if (!pendingProfile.shop_name) { setError('Dukaan ka naam daalo'); return }
    setError('')
    setStep('category')
  }

  // Step 4 — Category select then OTP
  async function selectCategory(cat) {
    updateProfile('category', cat)
    await sendOTP('seller')
  }

  // Send OTP — naye user ke liye shouldCreateUser: true
  async function sendOTP(r) {
    setLoading(true)
    setError('')
    const isNewUser = !!(r || role)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: isNewUser }
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('otp')
  }

  // Step 5 — Verify OTP + save profile if new
  async function verifyOTP() {
    setError('')
    if (!otp || otp.length !== 6) { setError('6 digit OTP daalo'); return }
    setLoading(true)

    const { data, error } = await supabase.auth.verifyOtp({
      email, token: otp, type: 'email'
    })

    if (error) { setError(error.message); setLoading(false); return }

    const userId = data.user?.id
    if (!userId) { setError('Login fail hua, dobara try karo'); setLoading(false); return }

    // Check if new user — save profile
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!existing) {
      const isSeller = role === 'seller'
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: userId,
        email,
        role: role || 'buyer',
        is_seller: isSeller,
        owner_name: pendingProfile.owner_name || email.split('@')[0],
        shop_name: isSeller ? pendingProfile.shop_name : null,
        city: pendingProfile.city || 'Jamnagar',
        bio: pendingProfile.bio || null,
        category: isSeller ? pendingProfile.category : null,
        post_count: 0,
        follower_count: 0,
        plan: 'free',
        created_at: new Date().toISOString(),
      })

      if (upsertError) {
        console.error('Profile save error:', upsertError)
        setError('Profile save nahi hua: ' + upsertError.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    navigate('/home')
  }

  // Progress indicator
  const steps = role === 'seller'
    ? ['email', 'role', 'details', 'category', 'otp']
    : ['email', 'role', 'otp']
  const isNewUserFlow = ['role', 'details', 'category'].includes(step)

  return (
    <div className="min-h-screen bg-[#0f0a1e] flex flex-col items-center justify-center px-6 py-10">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">🛍️</div>
        <h1 className="text-2xl font-bold text-[#f5a623]">LokalBazaar</h1>
        <p className="text-sm text-white/50 mt-1">Apna ghar, apna bazaar</p>
      </div>

      <div className="w-full max-w-sm">
        {/* Progress bar */}
        {isNewUserFlow && (
          <div className="flex gap-1.5 mb-6">
            {(role === 'seller' ? ['role', 'details', 'category', 'otp'] : ['role', 'otp']).map((s) => (
              <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${
                steps.indexOf(step) > steps.indexOf(s) || step === s ? 'bg-[#f5a623]' : 'bg-white/10'
              }`} />
            ))}
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

          {/* STEP — Email */}
          {step === 'email' && (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Shuru karo 👋</h2>
              <p className="text-sm text-white/50 mb-5">Apni email daalo</p>
              <label className="text-xs text-white/50 mb-1 block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkEmail()}
                placeholder="tumhari@email.com"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30 mb-4"
              />
              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
              <button
                onClick={checkEmail}
                disabled={loading || checking}
                className="w-full bg-[#f5a623] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#e09520] transition-colors disabled:opacity-50"
              >
                {checking ? 'Check kar raha hun...' : loading ? 'Bhej raha hun...' : 'Aage Bado →'}
              </button>
            </>
          )}

          {/* STEP — Role */}
          {step === 'role' && (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Welcome! 🎉</h2>
              <p className="text-sm text-white/50 mb-6">Pehli baar aa rahe ho — batao tum kaun ho?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => selectRole('seller')}
                  className="flex flex-col items-center gap-3 p-5 bg-white/5 border-2 border-white/10 rounded-2xl hover:border-[#f5a623] hover:bg-[#f5a623]/5 transition-all group"
                >
                  <span className="text-3xl">🏪</span>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-white group-hover:text-[#f5a623] transition-colors">Seller</div>
                    <div className="text-xs text-white/40 mt-0.5 leading-tight">Apni dukaan banana chahta hun</div>
                  </div>
                </button>
                <button
                  onClick={() => selectRole('buyer')}
                  disabled={loading}
                  className="flex flex-col items-center gap-3 p-5 bg-white/5 border-2 border-white/10 rounded-2xl hover:border-[#f5a623] hover:bg-[#f5a623]/5 transition-all group"
                >
                  <span className="text-3xl">🛒</span>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-white group-hover:text-[#f5a623] transition-colors">Buyer</div>
                    <div className="text-xs text-white/40 mt-0.5 leading-tight">Products dhundhna chahta hun</div>
                  </div>
                </button>
              </div>
              {loading && <p className="text-center text-white/40 text-xs mt-4">OTP bhej raha hun...</p>}
              <button onClick={() => setStep('email')} className="w-full text-center text-xs text-white/30 mt-4 hover:text-white/50 transition-colors">← Wapas</button>
            </>
          )}

          {/* STEP — Seller Details */}
          {step === 'details' && (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Dukaan ki details 🛍️</h2>
              <p className="text-sm text-white/50 mb-5">Thoda basic info chahiye</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Tumhara naam *</label>
                  <input
                    value={pendingProfile.owner_name}
                    onChange={e => updateProfile('owner_name', e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Dukaan ka naam *</label>
                  <input
                    value={pendingProfile.shop_name}
                    onChange={e => updateProfile('shop_name', e.target.value)}
                    placeholder="Radha Sarees, Kiran Sweets..."
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Sheher</label>
                  <input
                    value={pendingProfile.city}
                    onChange={e => updateProfile('city', e.target.value)}
                    placeholder="Jamnagar"
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Bio (optional)</label>
                  <textarea
                    value={pendingProfile.bio}
                    onChange={e => updateProfile('bio', e.target.value)}
                    placeholder="Apni dukaan ke baare mein..."
                    rows={2}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30 resize-none"
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
              <button onClick={goToCategory} className="w-full bg-[#f5a623] text-white font-semibold py-3 rounded-xl text-sm mt-4 hover:bg-[#e09520] transition-colors">
                Aage →
              </button>
              <button onClick={() => setStep('role')} className="w-full text-center text-xs text-white/30 mt-3 hover:text-white/50 transition-colors">← Wapas</button>
            </>
          )}

          {/* STEP — Category */}
          {step === 'category' && (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Kya bechte ho? 🤔</h2>
              <p className="text-sm text-white/50 mb-4">Ek category chuno</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => selectCategory(cat.id)}
                    disabled={loading}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/10 bg-white/5 hover:border-[#f5a623] hover:bg-[#f5a623]/5 transition-all disabled:opacity-50"
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="text-xs font-medium text-white/70 text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
              {loading && <p className="text-center text-white/40 text-xs">OTP bhej raha hun...</p>}
              <button onClick={() => setStep('details')} className="w-full text-center text-xs text-white/30 mt-2 hover:text-white/50 transition-colors">← Wapas</button>
            </>
          )}

          {/* STEP — OTP */}
          {step === 'otp' && (
            <>
              <button onClick={() => setStep(role ? 'category' : 'email')} className="text-white/50 text-xs mb-4 flex items-center gap-1 hover:text-white transition-colors">
                ← Wapas
              </button>
              {role ? (
                <>
                  <h2 className="text-lg font-semibold text-white mb-1">Almost ho gaya! 🎉</h2>
                  <p className="text-sm text-white/50 mb-4">Last step — OTP verify karo</p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-white mb-1">Wapas aaye! 👋</h2>
                  <p className="text-sm text-white/50 mb-4">OTP verify karo — seedha home pe jaoge</p>
                </>
              )}
              <label className="text-xs text-white/50 mb-1 block">
                6-digit OTP — <span className="text-white/60">{email}</span> pe bheja
              </label>
              <input
                type="number"
                value={otp}
                onChange={e => setOtp(e.target.value.slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && verifyOTP()}
                placeholder="• • • • • •"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl tracking-[0.5em] outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/20 mb-4"
              />
              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
              <button
                onClick={verifyOTP}
                disabled={loading}
                className="w-full bg-[#f5a623] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#e09520] transition-colors disabled:opacity-50"
              >
                {loading ? 'Verify ho raha hai...' : 'Verify karo →'}
              </button>
              <button onClick={() => sendOTP()} className="w-full text-center text-xs text-white/40 mt-3 hover:text-white/60 transition-colors">
                OTP nahi mila? Dobara bhejo
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-white/20 mt-6 text-center">
        Koi password nahi — sirf OTP ✓<br />Koi payment nahi, koi fraud nahi ✓
      </p>
    </div>
  )
}