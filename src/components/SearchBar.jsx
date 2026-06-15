import { useState, useRef } from 'react'
import { Mic, Search  } from 'lucide-react';

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  const [listening, setListening] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const recognitionRef = useRef(null)
  const inputRef = useRef(null)

  function startVoice() {
    if (isIOS) {
      // iOS pe input focus karo aur hint dikhao
      inputRef.current?.focus()
      setShowIOSHint(true)
      setTimeout(() => setShowIOSHint(false), 4000)
      return
    }

    // Android + Desktop
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice search support nahi hai'); return }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }

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
        for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript
        onChange(transcript)
      }
      recognition.onerror = () => setListening(false)
      recognition.onend = () => setListening(false)
      recognition.start()
    } catch { setListening(false) }
  }

  return (
    <div className="relative flex gap-2 items-center px-4">
      <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-2 focus-within:border-[#f5a623] transition-colors">
        <span className="text-sm text-white/40"><Search size={16} /></span>
        <input
          ref={inputRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
        />
        {value && (
          <button onClick={() => onChange('')} className="text-white/30 hover:text-white text-xs transition-colors">✕</button>
        )}
      </div>

      {/* Mic button */}
      <button
        onClick={startVoice}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          listening
            ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/40'
            : 'bg-[#f5a623] hover:bg-[#e09520]'
        }`}
      >
        <span className="text-base"><Mic size={17}/></span>
      </button>

      {/* iOS animated hint */}
      {showIOSHint && (
        <div className="absolute -bottom-16 right-0 z-50 flex flex-col items-end">
          {/* Arrow pointing down-right toward keyboard mic */}
          <div className="flex items-center gap-2 bg-[#1a1035] border border-[#f5a623]/40 rounded-2xl px-3 py-2 shadow-xl">
            <span className="text-sm"><Mic/></span>
            <span className="text-xs text-white/80 whitespace-nowrap">Keyboard pe mic dabao</span>
          </div>
          {/* Animated bouncing arrow */}
          <div className="animate-bounce text-[#f5a623] text-xl mt-1 mr-1">↓</div>
        </div>
      )}
    </div>
  )
}
