import { useState } from 'react'

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  const [listening, setListening] = useState(false)

  function startVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'hi-IN'
    recognition.interimResults = false
    recognition.onstart = () => setListening(true)
    recognition.onresult = (e) => onChange(e.results[0][0].transcript)
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
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
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          listening ? 'bg-red-500 animate-pulse' : 'bg-[#f5a623] hover:bg-[#e09520]'
        }`}
        title="Voice se bolo — Hindi ya Gujarati"
      >
        <span className="text-base">{listening ? '⏺' : '🎙️'}</span>
      </button>
    </div>
  )
}
