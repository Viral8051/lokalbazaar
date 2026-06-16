import { useState, useRef } from 'react'
import { Mic, Search } from 'lucide-react'

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  const [listening, setListening] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [focused, setFocused] = useState(false)
  const recognitionRef = useRef(null)
  const inputRef = useRef(null)

  function startVoice() {
    if (isIOS) {
      inputRef.current?.focus()
      setShowIOSHint(true)
      setTimeout(() => setShowIOSHint(false), 4000)
      return
    }
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
    <div style={{ position: 'relative', display: 'flex', gap: 8, alignItems: 'center' }}>

      {/* Search box */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-input)',
        border: `1px solid ${focused ? '#FF4C29' : 'var(--border-md)'}`,
        borderRadius: 999,
        padding: '7px 14px',
        transition: 'border-color 0.2s',
      }}>
        <Search size={16} style={{ color: 'var(--text-hint)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-hint)', fontSize: 12, padding: 0,
            }}
          >✕</button>
        )}
      </div>

      {/* Mic button */}
      <button
        onClick={startVoice}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: listening ? '#ef4444' : '#FF4C29',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all 0.2s',
          transform: listening ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        <Mic size={17} color="white" />
      </button>

      {/* iOS hint */}
      {showIOSHint && (
        <div style={{
          position: 'absolute', bottom: -64, right: 0,
          zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '8px 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}>
            <Mic size={14} color="#FF4C29" />
            <span style={{ fontSize: 12, color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>
              Keyboard pe mic dabao
            </span>
          </div>
          <div style={{ color: '#FF4C29', fontSize: 20, marginTop: 4, marginRight: 4 }}>↓</div>
        </div>
      )}
    </div>
  )
}
