import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

const CATEGORIES = [
  { id: 'saree',     label: 'Saree & Textile',  emoji: '🥻' },
  { id: 'food',      label: 'Homemade Food',     emoji: '🍱' },
  { id: 'sweets',    label: 'Mithai & Sweets',   emoji: '🍬' },
  { id: 'handicraft',label: 'Handicraft',        emoji: '🏺' },
  { id: 'jewellery', label: 'Jewellery',         emoji: '💍' },
  { id: 'beauty',    label: 'Beauty & Skincare', emoji: '🧴' },
  { id: 'clothing',  label: 'Clothing',          emoji: '👗' },
  { id: 'other',     label: 'Other',             emoji: '🛍️' },
]

const inp = {
  width: '100%',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-md)',
  borderRadius: 14,
  padding: '12px 16px',
  color: 'var(--text)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
}

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [step, setStep]       = useState('email')
  const [email, setEmail]     = useState(location.state?.prefillEmail || '')
  const [otp, setOtp]         = useState('')
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError]     = useState('')
  const [pendingProfile, setPendingProfile] = useState({
    owner_name: '', shop_name: '', city: 'Jamnagar', bio: '', category: '', phone: ''
  })

  const upd = (k, v) => setPendingProfile(p => ({ ...p, [k]: v }))

  async function checkEmail() {
    setError('')
    if (!email.includes('@')) { setError('Valid email daalo'); return }
    setChecking(true)
    const { data } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
    setChecking(false)
    if (data) await sendOTP()
    else setStep('role')
  }

  function selectRole(r) {
    setRole(r)
    if (r === 'buyer') setStep('buyer-details')
    else setStep('details')
  }

  function goToCategory() {
    if (!pendingProfile.owner_name) { setError('Apna naam daalo'); return }
    if (!pendingProfile.shop_name)  { setError('Dukaan ka naam daalo'); return }
    setError(''); setStep('category')
  }

  async function selectCategory(cat) {
    upd('category', cat)
    await sendOTP('seller')
  }

  async function sendOTP(r) {
    setLoading(true); setError('')
    const isNewUser = !!(r || role)
    const { data, error } = await supabase.auth.signInWithOtp({
      email, options: { shouldCreateUser: isNewUser }
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    if (data?.session) {
      await saveProfile(data.session.user.id, r)
      navigate('/home'); return
    }
    setStep('otp')
  }

  async function saveProfile(userId, r) {
    const currentRole = r || role
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle()
    if (existing) return
    const isSeller = currentRole === 'seller'
    await supabase.from('profiles').upsert({
      id: userId, email,
      phone: pendingProfile.phone || null,
      role: currentRole || 'buyer',
      is_seller: isSeller,
      owner_name: pendingProfile.owner_name || email.split('@')[0],
      shop_name:  isSeller ? pendingProfile.shop_name  : null,
      city:       pendingProfile.city || 'Jamnagar',
      bio:        pendingProfile.bio  || null,
      category:   isSeller ? pendingProfile.category   : null,
      post_count: 0, follower_count: 0, plan: 'free',
      created_at: new Date().toISOString(),
    })
  }

  async function verifyOTP() {
    setError('')
    if (!otp || otp.length !== 6) { setError('6 digit OTP daalo'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (error) { setError(error.message); setLoading(false); return }
    const userId = data.user?.id
    if (!userId) { setError('Login fail hua, dobara try karo'); setLoading(false); return }
    await saveProfile(userId, null)
    setLoading(false)
    navigate('/home')
  }

  const steps = role === 'seller' ? ['email','role','details','category','otp'] : ['email','role','otp']
  const isNewFlow = ['role','details','category','buyer-details'].includes(step)

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '24px 20px',
  }

  const btnPrimary = {
    width: '100%', background: '#FF4C29', color: 'white',
    fontWeight: 700, fontSize: 14, padding: '13px',
    border: 'none', borderRadius: 14, cursor: 'pointer',
    fontFamily: 'inherit', marginTop: 8,
  }

  const btnBack = {
    width: '100%', background: 'transparent', color: 'var(--text-hint)',
    fontSize: 12, padding: '10px', border: 'none',
    cursor: 'pointer', fontFamily: 'inherit',
  }

  const label = { fontSize: 12, color: 'var(--text-sub)', marginBottom: 6, display: 'block' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>

      {/* Theme toggle */}
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <ThemeToggle />
      </div>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🛍️</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>
          Lokal<span style={{ color: '#FF4C29' }}>Bazaar</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>Apna ghar, apna bazaar</p>
      </div>

      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Progress */}
        {isNewFlow && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {(role === 'seller' ? ['role','details','category','otp'] : ['role','otp']).map(s => (
              <div key={s} style={{
                flex: 1, height: 3, borderRadius: 4,
                background: steps.indexOf(step) >= steps.indexOf(s) ? '#FF4C29' : 'var(--border-md)'
              }} />
            ))}
          </div>
        )}

        <div style={cardStyle}>

          {/* EMAIL */}
          {step === 'email' && <>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Shuru karo 👋</h2>
            <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 20 }}>Apni email daalo</p>
            <label style={label}>Email Address</label>
            <input style={inp} type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkEmail()}
              placeholder="tumhari@email.com"
            />
            {error && <p style={{ color: '#FF4C29', fontSize: 12, marginTop: 8 }}>{error}</p>}
            <button style={btnPrimary} onClick={checkEmail} disabled={loading || checking}>
              {checking ? 'Check kar raha hun...' : loading ? 'Bhej raha hun...' : 'Aage Bado →'}
            </button>
          </>}

          {/* ROLE */}
          {step === 'role' && <>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Welcome! 🎉</h2>
            <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 20 }}>Tum kaun ho?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[{r:'seller',icon:'🏪',label:'Seller',sub:'Dukaan banana chahta hun'},
                {r:'buyer', icon:'🛒',label:'Buyer', sub:'Products dhundhna chahta hun'}].map(({r,icon,label:lb,sub}) => (
                <button key={r} onClick={() => selectRole(r)} style={{
                  background: 'var(--bg-surf)', border: '2px solid var(--border)',
                  borderRadius: 16, padding: '18px 12px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  fontFamily: 'inherit', transition: 'all 0.2s',
                }}>
                  <span style={{ fontSize: 28 }}>{icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{lb}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-sub)', textAlign: 'center', lineHeight: 1.4 }}>{sub}</span>
                </button>
              ))}
            </div>
            {loading && <p style={{ textAlign: 'center', color: 'var(--text-hint)', fontSize: 12, marginTop: 12 }}>OTP bhej raha hun...</p>}
            <button style={btnBack} onClick={() => setStep('email')}>← Wapas</button>
          </>}

          {/* BUYER DETAILS */}
          {step === 'buyer-details' && <>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Apna parichay do 👋</h2>
            <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 20 }}>Thoda basic info chahiye</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { k: 'owner_name', lbl: 'Tumhara naam *', ph: 'Full name', t: 'text' },
                { k: 'phone',      lbl: 'Phone (optional)', ph: '+91 98765 43210', t: 'tel' },
                { k: 'city',       lbl: 'Sheher', ph: 'Jamnagar', t: 'text' },
              ].map(({k,lbl,ph,t}) => <div key={k}>
                <label style={label}>{lbl}</label>
                <input style={inp} type={t} value={pendingProfile[k]}
                  onChange={e => upd(k, e.target.value)} placeholder={ph} />
              </div>)}
            </div>
            {error && <p style={{ color: '#FF4C29', fontSize: 12, marginTop: 8 }}>{error}</p>}
            <button style={btnPrimary} disabled={loading} onClick={() => {
              if (!pendingProfile.owner_name) { setError('Apna naam daalo'); return }
              setError(''); sendOTP('buyer')
            }}>
              {loading ? 'OTP bhej raha hun...' : 'OTP Bhejo →'}
            </button>
            <button style={btnBack} onClick={() => setStep('role')}>← Wapas</button>
          </>}

          {/* SELLER DETAILS */}
          {step === 'details' && <>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Dukaan ki details 🛍️</h2>
            <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 20 }}>Thoda basic info chahiye</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { k: 'owner_name', lbl: 'Tumhara naam *',    ph: 'Full name' },
                { k: 'shop_name',  lbl: 'Dukaan ka naam *',  ph: 'Radha Sarees, Kiran Sweets...' },
                { k: 'city',       lbl: 'Sheher',            ph: 'Jamnagar' },
              ].map(({k,lbl,ph}) => <div key={k}>
                <label style={label}>{lbl}</label>
                <input style={inp} value={pendingProfile[k]}
                  onChange={e => upd(k, e.target.value)} placeholder={ph} />
              </div>)}
              <div>
                <label style={label}>Bio (optional)</label>
                <textarea style={{ ...inp, resize: 'none' }} rows={2}
                  value={pendingProfile.bio}
                  onChange={e => upd('bio', e.target.value)}
                  placeholder="Apni dukaan ke baare mein..." />
              </div>
            </div>
            {error && <p style={{ color: '#FF4C29', fontSize: 12, marginTop: 8 }}>{error}</p>}
            <button style={btnPrimary} onClick={goToCategory}>Aage →</button>
            <button style={btnBack} onClick={() => setStep('role')}>← Wapas</button>
          </>}

          {/* CATEGORY */}
          {step === 'category' && <>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Kya bechte ho? 🤔</h2>
            <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 16 }}>Ek category chuno</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => selectCategory(cat.id)} disabled={loading}
                  style={{
                    background: 'var(--bg-surf)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '12px 8px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    fontFamily: 'inherit', opacity: loading ? 0.5 : 1,
                  }}>
                  <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-sub)', textAlign: 'center', lineHeight: 1.3 }}>{cat.label}</span>
                </button>
              ))}
            </div>
            {loading && <p style={{ textAlign: 'center', color: 'var(--text-hint)', fontSize: 12 }}>OTP bhej raha hun...</p>}
            <button style={btnBack} onClick={() => setStep('details')}>← Wapas</button>
          </>}

          {/* OTP */}
          {step === 'otp' && <>
            <button style={btnBack} onClick={() => setStep(role === 'buyer' ? 'buyer-details' : role ? 'category' : 'email')}>← Wapas</button>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              {role ? 'Almost ho gaya! 🎉' : 'Wapas aaye! 👋'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 20 }}>
              OTP check karo — <span style={{ color: 'var(--text)' }}>{email}</span>
            </p>
            <label style={label}>6-digit OTP</label>
            <input style={{ ...inp, textAlign: 'center', fontSize: 22, letterSpacing: 12, fontWeight: 700 }}
              type="number" value={otp}
              onChange={e => setOtp(e.target.value.slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && verifyOTP()}
              placeholder="• • • • • •"
            />
            {error && <p style={{ color: '#FF4C29', fontSize: 12, marginTop: 8 }}>{error}</p>}
            <button style={btnPrimary} onClick={verifyOTP} disabled={loading}>
              {loading ? 'Verify ho raha hai...' : 'Verify karo →'}
            </button>
            <button style={{ ...btnBack, marginTop: 4 }} onClick={() => sendOTP()}>OTP nahi mila? Dobara bhejo</button>
          </>}

        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 20, textAlign: 'center', lineHeight: 1.8 }}>
        Koi password nahi — sirf OTP ✓<br />Koi payment nahi, koi fraud nahi ✓
      </p>
    </div>
  )
}
