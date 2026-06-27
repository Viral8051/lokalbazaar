import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = [
  { id:'saree',      label:'Saree & Textile',  emoji:'🥻' },
  { id:'food',       label:'Homemade Food',     emoji:'🍱' },
  { id:'sweets',     label:'Mithai & Sweets',   emoji:'🍬' },
  { id:'handicraft', label:'Handicraft',        emoji:'🏺' },
  { id:'jewellery',  label:'Jewellery',         emoji:'💍' },
  { id:'beauty',     label:'Beauty & Skincare', emoji:'🧴' },
  { id:'clothing',   label:'Clothing',          emoji:'👗' },
  { id:'other',      label:'Other',             emoji:'🛍️' },
]

const inp = {
  width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)',
  borderRadius:14, padding:'12px 16px', color:'var(--text)',
  fontSize:14, outline:'none', fontFamily:'inherit',
}

export default function OnboardingPage() {
  const { user, fetchProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep]     = useState(0)
  const [role, setRole]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [form, setForm]     = useState({ shop_name:'', owner_name:'', category:'', city:'Jamnagar', bio:'' })

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function selectRole(r) {
    setRole(r)
    if (r === 'buyer') {
      setLoading(true)
      const { error } = await supabase.from('profiles').upsert({
        id: user.id, email: user.email, role:'buyer', is_seller:false,
        owner_name: user.email.split('@')[0], plan:'free',
        created_at: new Date().toISOString(),
      })
      setLoading(false)
      if (error) { setError(error.message); return }
      await fetchProfile(user.id)
      navigate('/home')
    } else { setStep(1) }
  }

  function goToCategory() {
    if (!form.owner_name) { setError('Apna naam daalo'); return }
    if (!form.shop_name)  { setError('Dukaan ka naam daalo'); return }
    setError(''); setStep(2)
  }

  async function finish() {
    if (!form.category) { setError('Category chuno'); return }
    setLoading(true); setError('')
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, email: user.email, role:'seller', is_seller:true,
      ...form, post_count:0, follower_count:0, plan:'free',
      created_at: new Date().toISOString(),
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    await fetchProfile(user.id)
    navigate('/home')
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px' }}>
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontSize:48, marginBottom:8 }}>🛍️</div>
        <h1 style={{ fontSize:24, fontWeight:800, color:'var(--text)' }}>
          <span style={{ color:'#FF4C29' }}>V</span>epa<span style={{ color:'#FF4C29' }}>R</span>
        </h1>
      </div>

      <div style={{ width:'100%', maxWidth:360 }}>
        {step === 0 && (
          <>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <h2 style={{ fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Welcome! 🎉</h2>
              <p style={{ fontSize:13, color:'var(--text-sub)' }}>Pehle batao — aap kaun hain?</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[{r:'seller',icon:'🏪',lb:'Seller',sub:'Apni dukaan banana chahta hun'},
                {r:'buyer', icon:'🛒',lb:'Buyer', sub:'Products dhundhna chahta hun'}].map(({r,icon,lb,sub}) => (
                <button key={r} onClick={() => selectRole(r)} disabled={loading} style={{
                  background:'var(--bg-card)', border:'2px solid var(--border)',
                  borderRadius:16, padding:'20px 12px', cursor:'pointer',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                  fontFamily:'inherit',
                }}>
                  <span style={{ fontSize:32 }}>{icon}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{lb}</span>
                  <span style={{ fontSize:11, color:'var(--text-sub)', textAlign:'center', lineHeight:1.4 }}>{sub}</span>
                </button>
              ))}
            </div>
            {loading && <p style={{ textAlign:'center', color:'var(--text-hint)', fontSize:12, marginTop:12 }}>Setting up...</p>}
            {error && <p style={{ color:'#FF4C29', fontSize:12, marginTop:10, textAlign:'center' }}>{error}</p>}
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ display:'flex', gap:6, marginBottom:24 }}>
              <div style={{ flex:1, height:3, borderRadius:4, background:'#FF4C29' }} />
              <div style={{ flex:1, height:3, borderRadius:4, background:'var(--border)' }} />
            </div>
            <h2 style={{ fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Apni dukaan banao 🛍️</h2>
            <p style={{ fontSize:13, color:'var(--text-sub)', marginBottom:20 }}>Thoda basic info chahiye</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { k:'owner_name', lbl:'Tumhara naam *',   ph:'Full name' },
                { k:'shop_name',  lbl:'Dukaan ka naam *', ph:'Radha Sarees, Kiran Sweets...' },
                { k:'city',       lbl:'Sheher',           ph:'Jamnagar' },
              ].map(({k,lbl,ph}) => (
                <div key={k}>
                  <label style={{ fontSize:12, color:'var(--text-sub)', marginBottom:6, display:'block' }}>{lbl}</label>
                  <input style={inp} value={form[k]} onChange={e => upd(k, e.target.value)} placeholder={ph} />
                </div>
              ))}
              <div>
                <label style={{ fontSize:12, color:'var(--text-sub)', marginBottom:6, display:'block' }}>Bio (optional)</label>
                <textarea style={{ ...inp, resize:'none' }} rows={3}
                  value={form.bio} onChange={e => upd('bio', e.target.value)}
                  placeholder="Apni dukaan ke baare mein batao..." />
              </div>
            </div>
            {error && <p style={{ color:'#FF4C29', fontSize:12, marginTop:8 }}>{error}</p>}
            <button onClick={goToCategory} style={{
              width:'100%', background:'#FF4C29', color:'white',
              fontWeight:700, fontSize:14, padding:'13px', border:'none',
              borderRadius:14, cursor:'pointer', fontFamily:'inherit', marginTop:16,
            }}>Aage →</button>
            <button onClick={() => setStep(0)} style={{
              width:'100%', background:'transparent', color:'var(--text-hint)',
              fontSize:12, padding:'10px', border:'none', cursor:'pointer', fontFamily:'inherit', marginTop:4,
            }}>← Wapas</button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ display:'flex', gap:6, marginBottom:24 }}>
              <div style={{ flex:1, height:3, borderRadius:4, background:'#FF4C29' }} />
              <div style={{ flex:1, height:3, borderRadius:4, background:'#FF4C29' }} />
            </div>
            <h2 style={{ fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Kya bechte ho? 🤔</h2>
            <p style={{ fontSize:13, color:'var(--text-sub)', marginBottom:20 }}>Ek category chuno</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => upd('category', cat.id)} style={{
                  background: form.category === cat.id ? 'rgba(255,76,41,0.1)' : 'var(--bg-card)',
                  border: `2px solid ${form.category === cat.id ? '#FF4C29' : 'var(--border)'}`,
                  borderRadius:14, padding:'14px 8px', cursor:'pointer',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                  fontFamily:'inherit',
                }}>
                  <span style={{ fontSize:24 }}>{cat.emoji}</span>
                  <span style={{ fontSize:11, color: form.category === cat.id ? '#FF4C29' : 'var(--text-sub)', textAlign:'center', lineHeight:1.3 }}>{cat.label}</span>
                </button>
              ))}
            </div>
            {error && <p style={{ color:'#FF4C29', fontSize:12, marginBottom:8 }}>{error}</p>}
            <button onClick={finish} disabled={loading || !form.category} style={{
              width:'100%', background:'#FF4C29', color:'white',
              fontWeight:700, fontSize:14, padding:'13px', border:'none',
              borderRadius:14, cursor:'pointer', fontFamily:'inherit', opacity: (!form.category || loading) ? 0.5 : 1,
            }}>{loading ? 'Saving...' : 'Dukaan shuru karo! 🚀'}</button>
            <button onClick={() => setStep(1)} style={{
              width:'100%', background:'transparent', color:'var(--text-hint)',
              fontSize:12, padding:'10px', border:'none', cursor:'pointer', fontFamily:'inherit', marginTop:4,
            }}>← Wapas</button>
          </>
        )}
      </div>
    </div>
  )
}
