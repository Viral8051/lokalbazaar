import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  // Har tab ka apna unique ID — tab cross-contamination rokne ke liye
  const tabId = useRef(Math.random().toString(36).slice(2))

  useEffect(() => {
    // Is tab ka apna session seedha Supabase se lo
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // SIGN_IN ya SIGNED_OUT — sirf tab ka own action handle karo
      // TOKEN_REFRESHED, INITIAL_SESSION — normal events hain, handle karo
      // Dusre tab ka SIGNED_IN/OUT ignore karo — lekin uski detection mushkil hai
      // Isliye hum page visibility use karte hain

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setNeedsOnboarding(false)
        setLoading(false)
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else setLoading(false)
      }
    })

    // ── Key fix: jab tab focus aaye tab apna session verify karo ──
    // Agar dusre tab mein login badla to is tab mein refresh pe sahi session aayega
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // Tab wapas focus mein aaya — apna current session check karo
        supabase.auth.getSession().then(({ data: { session } }) => {
          const currentUserId = user?.id
          const newUserId = session?.user?.id

          // Agar user badal gaya (dusre tab se) to is tab ko update MAT karo
          // Sirf reload karo taaki user confuse na ho
          if (currentUserId && newUserId && currentUserId !== newUserId) {
            // Dusre tab ka session is tab mein aa gaya — warn karo
            console.warn(`[Tab ${tabId.current}] Different user detected on focus. Reloading...`)
            window.location.reload()
          }

          // Agar is tab mein login tha aur dusre tab ne logout kiya
          if (currentUserId && !newUserId) {
            setUser(null)
            setProfile(null)
            setNeedsOnboarding(false)
            setLoading(false)
          }
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) { console.error('fetchProfile error:', error); setLoading(false); return }

    if (!data) {
      setNeedsOnboarding(true)
      setProfile(null)
    } else {
      setProfile(data)
      setNeedsOnboarding(false)
    }
    setLoading(false)
  }

  async function signOut() {
    // Sirf is tab ka session clear karo — dusre tabs ko affect mat karo
    await supabase.auth.signOut({ scope: 'local' })
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, needsOnboarding, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
