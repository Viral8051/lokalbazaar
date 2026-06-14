import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Custom storage — sessionStorage use karo localStorage ki jagah
// sessionStorage tab-specific hota hai — ek tab ka session dusre tab ko affect nahi karta
const tabStorage = {
  getItem: (key) => {
    // Pehle sessionStorage check karo (tab-specific)
    const tabVal = sessionStorage.getItem(key)
    if (tabVal) return tabVal

    // Agar sessionStorage mein nahi hai aur localStorage mein hai
    // toh copy karo (pehli baar tab khulne pe)
    const localVal = localStorage.getItem(key)
    if (localVal) {
      sessionStorage.setItem(key, localVal)
      return localVal
    }
    return null
  },
  setItem: (key, value) => {
    // Sirf sessionStorage mein save karo — localStorage nahi
    sessionStorage.setItem(key, value)
  },
  removeItem: (key) => {
    // Sirf is tab ka session clear karo
    sessionStorage.removeItem(key)
    // localStorage bhi clear karo taaki naye tabs clean start karein
    localStorage.removeItem(key)
  },
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: tabStorage,        // har tab ka apna storage
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
})
