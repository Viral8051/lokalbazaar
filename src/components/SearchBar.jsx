import { useState, useRef } from 'react'

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice search support nahi hai is browser mein'); return }

    // Pehle se chal raha hai toh band karo
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
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        console.log('🎙️ Voice started')
        setListening(true)
      }

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript
        console.log('📝 Transcript:', transcript)
        onChange(transcript)
      }

      recognition.onerror = (e) => {
        console.log('❌ Voice error:', e.error, e.message)
        setListening(false)
      }

      recognition.onend = () => {
        console.log('🔴 Voice ended')
        setListening(false)
      }

      // Android pe seedha start — koi async nahi
      recognition.start()
      console.log('✅ recognition.start() called')

    } catch (err) {
      console.log('❌ Exception:', err)
      setListening(false)
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-2 focus-within:border-[#f5a623] transition-colors">
        <span className="text-sm text-white/40">🔍</span>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
        />
        {value && (
          <button onClick={() => onChange('')} className="text-white/30 hover:text-white text-xs transition-colors">✕</button>
        )}
      </div>
      <button
        onClick={startVoice}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          listening
            ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/40'
            : 'bg-[#f5a623] hover:bg-[#e09520]'
        }`}
      >
        <span className="text-base">{listening ? '⏺' : '🎙️'}</span>
      </button>
    </div>
  )
}