import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function sendOTP() {
    setError('')
    if (!email.includes('@')) { setError('Valid email daalo'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    if (error) setError(error.message)
    else setStep('otp')
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single()

    if (!profile) navigate('/onboarding')
    else navigate('/home')
  }

  return (
    <div className="min-h-screen bg-[#0f0a1e] flex flex-col items-center justify-center px-6">
      <div className="mb-10 text-center">
        <div className="text-4xl mb-2">🛍️</div>
        <h1 className="text-2xl font-bold text-[#f5a623]">LokalBazaar</h1>
        <p className="text-sm text-white/50 mt-1">Apna ghar, apna bazaar</p>
      </div>

      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6">
        {step === 'email' ? (
          <>
            <h2 className="text-lg font-semibold text-white mb-1">Login karo</h2>
            <p className="text-sm text-white/50 mb-5">Email pe OTP bhejenge</p>

            <label className="text-xs text-white/50 mb-1 block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOTP()}
              placeholder="tumhari@email.com"
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30 mb-4"
            />

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

            <button
              onClick={sendOTP}
              disabled={loading}
              className="w-full bg-[#f5a623] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#e09520] transition-colors disabled:opacity-50"
            >
              {loading ? 'Bhej raha hun...' : 'OTP Bhejo →'}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setStep('email')} className="text-white/50 text-xs mb-4 flex items-center gap-1 hover:text-white transition-colors">
              ← Wapas jao
            </button>
            <h2 className="text-lg font-semibold text-white mb-1">OTP verify karo</h2>
            <p className="text-sm text-white/50 mb-5">{email} pe bheja gaya</p>

            <label className="text-xs text-white/50 mb-1 block">6-digit OTP</label>
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
              {loading ? 'Check kar raha hun...' : 'Verify & Login →'}
            </button>

            <button onClick={sendOTP} className="w-full text-center text-xs text-white/40 mt-3 hover:text-white/60 transition-colors">
              OTP nahi mila? Dobara bhejo
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-white/20 mt-6 text-center">
        Login karke aap hamare terms se agree karte hain.<br />Koi payment nahi, koi fraud nahi. ✓
      </p>
    </div>
  )
}
