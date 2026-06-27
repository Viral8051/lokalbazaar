import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [shown, setShown] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Already installed check
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e) => {
      // preventDefault yahan call karo — banner rokne ke liye
      // phir hum manually prompt karenge
      e.preventDefault()
      setPrompt(e)
      // 3 second baad show karo
      setTimeout(() => setShown(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setShown(false)
      setPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!prompt) return
    // Ab prompt call karo — yahi sahi jagah hai
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setShown(false)
    setPrompt(null)
  }

  if (installed || !shown || !prompt) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-80 bg-[#1a1035] border border-[#f5a623]/30 rounded-2xl z-50 shadow-xl" style={{padding:'12px 16px'}}>
      <div className="flex items-start gap-3" style={{margin: '0 0 12px'}}>
        <img src="/icon-192.png" alt="VepaR" className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">VepaR install karo</div>
          <div className="text-xs text-white/50 mt-0.5">Home screen pe add karo — app jaisa feel</div>
        </div>
        <button onClick={() => setShown(false)} className="text-white/30 hover:text-white text-lg leading-none flex-shrink-0">✕</button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setShown(false)}
          className="flex-1 rounded-xl border border-white/10 text-xs text-white/50 hover:text-white transition-colors" style={{padding:'4px 8px'}}
        >
          Baad mein
        </button>
        <button
          onClick={install}
          className="flex-1 rounded-xl bg-[#f5a623] text-white text-xs font-medium hover:bg-[#e09520] transition-colors" style={{padding:'4px 8px'}}
        >
          Install karo 📲
        </button>
      </div>
    </div>
  )
}
