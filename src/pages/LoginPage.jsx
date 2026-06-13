import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('email') // email | otp
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function checkEmail() {
    setError('')
    if (!email.includes('@')) { setError('Valid email daalo'); return }
    setChecking(true)

    // Check profiles table mein email hai ya nahi
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    setChecking(false)

    if (data) {
      // Purana user — seedha OTP bhejo
      setIsNew(false)
      await sendOTP()
    } else {
      // Naya user — onboarding pe bhejo OTP ke baad
      setIsNew(true)
      await sendOTP()
    }
  }

  async function sendOTP() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('otp')
  }

  async function verifyOTP() {
    setError('')
    if (!otp || otp.length !== 6) { setError('6 digit OTP daalo'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    })
    setLoading(false)
    if (error) { setError(error.message); return }

    if (isNew) navigate('/onboarding')
    else navigate('/home')
  }

  return (
    <div className="min-h-screen bg-[#0f0a1e] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-3">🛍️</div>
        <h1 className="text-2xl font-bold text-[#f5a623]">LokalBazaar</h1>
        <p className="text-sm text-white/50 mt-1">Apna ghar, apna bazaar</p>
      </div>

      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6">

        {/* Step 1 — Email */}
        {step === 'email' && (
          <>
            <h2 className="text-lg font-semibold text-white mb-1">Shuru karo 👋</h2>
            <p className="text-sm text-white/50 mb-5">
              Apni email daalo — baaki hum sambhal lenge
            </p>

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
              {checking ? 'Check kar raha hun...' : loading ? 'OTP bhej raha hun...' : 'Aage Bado →'}
            </button>

            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex flex-col gap-2">
                {[
                  { icon: '✉️', text: 'Email daalo — hum check karenge' },
                  { icon: '🆕', text: 'Naye ho → Registration' },
                  { icon: '👋', text: 'Purane ho → Seedha login' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-base flex-shrink-0">{s.icon}</span>
                    <span className="text-xs text-white/40">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 2 — OTP */}
        {step === 'otp' && (
          <>
            <button onClick={() => setStep('email')} className="text-white/50 text-xs mb-4 flex items-center gap-1 hover:text-white transition-colors">
              ← Wapas jao
            </button>

            {/* Show different message for new vs existing */}
            {isNew ? (
              <>
                <h2 className="text-lg font-semibold text-white mb-1">Welcome! 🎉</h2>
                <p className="text-sm text-white/50 mb-1">
                  Pehli baar aa rahe ho — OTP verify karo
                </p>
                <p className="text-xs text-[#f5a623] mb-4">
                  Phir hum tumhara account setup karenge
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-white mb-1">Wapas aaye! 👋</h2>
                <p className="text-sm text-white/50 mb-4">
                  OTP verify karo — seedha home pe jaoge
                </p>
              </>
            )}

            <label className="text-xs text-white/50 mb-1 block">
              6-digit OTP — <span className="text-white/40">{email}</span> pe bheja gaya
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

      <p className="text-xs text-white/20 mt-6 text-center">
        Koi password nahi — sirf OTP ✓<br />Koi payment nahi, koi fraud nahi ✓
      </p>
    </div>
  )
}
