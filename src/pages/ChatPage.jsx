import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

// ── Chat List ──────────────────────────────────────────────────
export function ChatListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchConversations() }, [user])

  async function fetchConversations() {
    if (!user) return
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, shop_name, owner_name, role),
        receiver:profiles!messages_receiver_id_fkey(id, shop_name, owner_name, role)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    // Deduplicate — ek hi conversation dikhao chahe kaun sa side se dekho
    const seen = new Set()
    const convs = []
    for (const msg of (data || [])) {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      const partner   = msg.sender_id === user.id ? msg.receiver   : msg.sender
      if (!seen.has(partnerId)) {
        seen.add(partnerId)
        // Naam: buyer ka owner_name, seller ka shop_name
        const displayName = partner?.role === 'buyer'
          ? (partner?.owner_name || 'Buyer')
          : (partner?.shop_name || partner?.owner_name || 'Seller')
        convs.push({ partnerId, displayName, lastMsg: msg.text, time: msg.created_at })
      }
    }
    setConversations(convs)
    setLoading(false)
  }

  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  const timeAgo = (d) => {
    const diff = (Date.now() - new Date(d)) / 1000
    if (diff < 60) return 'abhi'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}d`
  }

  return (
    <Layout active="chat">
      <div className="px-4 py-3 border-b border-white/10">
        <h1 className="text-base font-semibold text-white">Messages</h1>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="p-4 flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <div className="text-4xl mb-3">💬</div>
            <div className="text-sm">Koi message nahi abhi</div>
          </div>
        ) : conversations.map(conv => (
          <div
            key={conv.partnerId}
            onClick={() => navigate(`/chat/${conv.partnerId}`)}
            className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-[#f5a623]/20 border border-[#f5a623]/30 flex items-center justify-center text-[#f5a623] font-bold text-sm flex-shrink-0">
              {initials(conv.displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{conv.displayName}</div>
              <div className="text-xs text-white/40 truncate">{conv.lastMsg}</div>
            </div>
            <div className="text-[10px] text-white/30 flex-shrink-0">{timeAgo(conv.time)}</div>
          </div>
        ))}
      </div>
    </Layout>
  )
}

// ── Chat Window ────────────────────────────────────────────────
export function ChatWindowPage() {
  const { sellerId } = useParams()   // yeh partnerId hai — buyer ya seller dono ke liye
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [partner, setPartner] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef()

  useEffect(() => {
    if (!user) return
    fetchPartner()
    fetchMessages()

    // Realtime — dono directions ke messages sun
    const channel = supabase
      .channel(`chat-${[user.id, sellerId].sort().join('-')}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new
        // Sirf is conversation ke messages add karo
        const isThisConv =
          (msg.sender_id === user.id && msg.receiver_id === sellerId) ||
          (msg.sender_id === sellerId && msg.receiver_id === user.id)
        if (isThisConv) {
          setMessages(m => {
            // temp message replace karo real se
            const exists = m.find(x => x.id === msg.id)
            if (exists) return m
            return [...m.filter(x => !x.id?.toString().startsWith('temp-')), msg]
          })
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [sellerId, user])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function fetchPartner() {
    const { data } = await supabase
      .from('profiles')
      .select('id, shop_name, owner_name, role')
      .eq('id', sellerId)
      .maybeSingle()
    setPartner(data)
  }

  async function fetchMessages() {
    if (!user) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      // Dono directions fetch karo — buyer→seller aur seller→buyer same conversation
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoading(false)
  }

  async function sendMessage() {
    if (!text.trim() || !user) return
    const msg = {
      sender_id: user.id,
      receiver_id: sellerId,
      text: text.trim(),
      created_at: new Date().toISOString()
    }
    setText('')
    // Optimistic update
    setMessages(m => [...m, { ...msg, id: 'temp-' + Date.now() }])
    await supabase.from('messages').insert(msg)
  }

  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  // Partner ka sahi naam — buyer ka owner_name, seller ka shop_name
  const partnerName = partner?.role === 'buyer'
    ? (partner?.owner_name || 'Buyer')
    : (partner?.shop_name || partner?.owner_name || 'Seller')

  // Message bubble mein naam dikhao
  const getSenderName = (msg) => {
    if (msg.sender_id === user?.id) return profile?.owner_name || profile?.shop_name || 'Aap'
    return partnerName
  }

  return (
    <Layout active="chat">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0f0a1e] z-10">
        <button onClick={() => navigate('/chat')} className="text-white/60 hover:text-white text-xl">←</button>
        <div className="w-9 h-9 rounded-full bg-[#f5a623]/20 border border-[#f5a623]/30 flex items-center justify-center text-[#f5a623] font-bold text-xs flex-shrink-0">
          {initials(partnerName)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">{partnerName || '...'}</div>
          <div className="text-[10px] text-white/40">
            {partner?.role === 'seller' ? '🏪 Seller' : '🛒 Buyer'}
          </div>
        </div>
        {partner?.role === 'seller' && (
          <button
            onClick={() => navigate(`/seller/${sellerId}`)}
            className="text-xs text-white/40 hover:text-white/70"
          >
            Profile →
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 flex flex-col gap-2">
        {loading ? (
          <div className="text-white/30 text-xs text-center py-8">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-white/30">
            <div className="text-3xl mb-2">👋</div>
            <div className="text-sm">Conversation shuru karo!</div>
          </div>
        ) : messages.map((msg, i) => {
          const isMine = msg.sender_id === user?.id
          // Naam sirf tab dikhao jab sender badla ho
          const prevMsg = messages[i - 1]
          const showName = !prevMsg || prevMsg.sender_id !== msg.sender_id

          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              {showName && (
                <span className="text-[10px] text-white/30 mb-0.5 px-1">
                  {getSenderName(msg)}
                </span>
              )}
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                isMine
                  ? 'bg-[#f5a623] text-white rounded-br-sm'
                  : 'bg-white/10 text-white rounded-bl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 bg-[#0f0a1e]">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Message karo..."
          className="flex-1 bg-white/10 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white outline-none focus:border-[#f5a623] transition-colors placeholder:text-white/30"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="w-10 h-10 rounded-full bg-[#f5a623] flex items-center justify-center text-white text-lg disabled:opacity-40 hover:bg-[#e09520] transition-colors flex-shrink-0"
        >
          ➤
        </button>
      </div>
    </Layout>
  )
}
