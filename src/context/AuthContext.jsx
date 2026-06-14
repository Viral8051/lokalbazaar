import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ACCOUNTS_KEY = 'lb_saved_accounts' // localStorage mein saved accounts

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [profile, setProfile]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [savedAccounts, setSavedAccounts]     = useState([]) // [{id, email, name, role, avatar}]

  useEffect(() => {
    loadSavedAccounts()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setNeedsOnboarding(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  function loadSavedAccounts() {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY)
      setSavedAccounts(raw ? JSON.parse(raw) : [])
    } catch { setSavedAccounts([]) }
  }

  function saveAccountToList(profileData, email) {
    if (!profileData) return
    const accounts = (() => {
      try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]') } catch { return [] }
    })()

    const entry = {
      id:     profileData.id,
      email:  email || profileData.email,
      name:   profileData.role === 'buyer'
                ? (profileData.owner_name || email)
                : (profileData.shop_name  || profileData.owner_name || email),
      role:   profileData.role,
      owner:  profileData.owner_name,
    }

    const updated = [entry, ...accounts.filter(a => a.id !== entry.id)]
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated))
    setSavedAccounts(updated)
  }

  function removeAccountFromList(accountId) {
    const updated = savedAccounts.filter(a => a.id !== accountId)
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated))
    setSavedAccounts(updated)
  }

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
      // Login hote hi account list mein save karo
      const { data: { session } } = await supabase.auth.getSession()
      saveAccountToList(data, session?.user?.email)
    }
    setLoading(false)
  }

  async function signOut() {
    // Current account list mein rehta hai — switch ke liye
    await supabase.auth.signOut()
  }

  async function signOutAndRemove() {
    // Account list se bhi hata do
    if (user) removeAccountFromList(user.id)
    await supabase.auth.signOut()
  }

  // Dusre account pe switch karo — seedha login page pe bhejo us email se
  async function switchAccount(email) {
    await supabase.auth.signOut()
    return email // LoginPage mein pre-fill kar denge
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading, needsOnboarding,
      savedAccounts,
      signOut, signOutAndRemove, switchAccount,
      fetchProfile, saveAccountToList
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
