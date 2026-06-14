import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

// ── Helpers ────────────────────────────────────────────────────
const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

const timeAgo = (d) => {
  const diff = (Date.now() - new Date(d)) / 1000
  if (diff < 60) return 'abhi'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

const formatTime = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// ✓ / ✓✓ / ✓✓ (blue) ticks
function MessageStatus({ msg, userId }) {
  if (msg.sender_id !== userId) return null
  if (msg.id?.toString().startsWith('temp-')) {
    return <span className="text-[10px] text-white/40 ml-1">✓</span>
  }
  if (msg.read) {
    return <span className="text-[10px] text-[#4fc3f7] ml-1" title="Seen">✓✓</span>
  }
  if (msg.delivered) {
    return <span className="text-[10px] text-white/60 ml-1" title="Delivered">✓✓</span>
  }
  return <span className="text-[10px] text-white/40 ml-1" title="Sent">✓</span>
}

// ── Chat List ──────────────────────────────────────────────────
export function ChatListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) fetchConversations() }, [user])

  // Realtime — naya message aaye to list update ho
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('chat-list-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new
          if (msg.sender_id === user.id || msg.receiver_id === user.id) {
            fetchConversations()
          }
        })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

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

    // Group by partner — latest message + unread count
    const partnerMap = {}
    for (const msg of (data || [])) {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      const partner   = msg.sender_id === user.id ? msg.receiver   : msg.sender

      if (!partnerMap[partnerId]) {
        const displayName = partner?.role === 'buyer'
          ? (partner?.owner_name || 'Buyer')
          : (partner?.shop_name || partner?.owner_name || 'Seller')

        partnerMap[partnerId] = {
          partnerId,
          displayName,
          lastMsg: msg.text,
          time: msg.created_at,
          unread: 0,
          lastSenderId: msg.sender_id,
        }
      }

      // Count unread — messages jo mujhe aaye aur maine nahi padhe
      if (msg.receiver_id === user.id && !msg.read) {
        partnerMap[partnerId].unread += 1
      }
    }

    setConversations(Object.values(partnerMap))
    setLoading(false)
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
            className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 cursor-pointer transition-colors ${
              conv.unread > 0 ? 'bg-[#f5a623]/5 hover:bg-[#f5a623]/10' : 'hover:bg-white/5'
            }`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-[#f5a623]/20 border border-[#f5a623]/30 flex items-center justify-center text-[#f5a623] font-bold text-sm">
                {initials(conv.displayName)}
              </div>
              {/* Unread badge */}
              {conv.unread > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#f5a623] flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">{conv.unread > 9 ? '9+' : conv.unread}</span>
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className={`text-sm truncate ${conv.unread > 0 ? 'font-semibold text-white' : 'font-medium text-white/80'}`}>
                {conv.displayName}
              </div>
              <div className={`text-xs truncate mt-0.5 ${conv.unread > 0 ? 'text-white/70' : 'text-white/40'}`}>
                {conv.lastSenderId === user.id ? '✓ ' : ''}{conv.lastMsg}
              </div>
            </div>

            {/* Time + unread dot */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className={`text-[10px] ${conv.unread > 0 ? 'text-[#f5a623]' : 'text-white/30'}`}>
                {timeAgo(conv.time)}
              </div>
              {conv.unread > 0 && (
                <div className="w-2 h-2 rounded-full bg-[#f5a623]" />
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}

// ── Chat Window ────────────────────────────────────────────────
export function ChatWindowPage() {
  const { sellerId } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [partner, setPartner] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    if (!user) return
    fetchPartner()
    fetchMessages()

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${[user.id, sellerId].sort().join('-')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const msg = payload.new
          const isThisConv =
            (msg.sender_id === user.id && msg.receiver_id === sellerId) ||
            (msg.sender_id === sellerId && msg.receiver_id === user.id)

          if (!isThisConv) return

          // Agar incoming message hai toh delivered + read mark karo
          if (msg.receiver_id === user.id) {
            await supabase.from('messages')
              .update({ delivered: true, read: true })
              .eq('id', msg.id)
            msg.delivered = true
            msg.read = true
          }

          setMessages(m => {
            const withoutTemp = m.filter(x => !x.id?.toString().startsWith('temp-'))
            const exists = withoutTemp.find(x => x.id === msg.id)
            if (exists) return m
            return [...withoutTemp, msg]
          })
        })
      // Realtime update — jab read status change ho (sender ko pata chale seen)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updated = payload.new
          setMessages(m => m.map(x => x.id === updated.id ? { ...x, ...updated } : x))
        })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [sellerId, user])

  // Jab chat window khule — pehle ke unread messages read mark karo
  useEffect(() => {
    if (!user || !sellerId) return
    markAllRead()
  }, [sellerId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function markAllRead() {
    await supabase
      .from('messages')
      .update({ read: true, delivered: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', sellerId)
      .eq('read', false)
  }

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
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    setMessages(data || [])
    setLoading(false)

    // Fetch ke baad bhi unread mark karo
    await markAllRead()
  }

  async function sendMessage() {
    if (!text.trim() || !user) return
    const msg = {
      sender_id: user.id,
      receiver_id: sellerId,
      text: text.trim(),
      read: false,
      delivered: false,
      created_at: new Date().toISOString()
    }
    setText('')
    const tempId = 'temp-' + Date.now()
    setMessages(m => [...m, { ...msg, id: tempId }])

    const { data } = await supabase.from('messages').insert(msg).select().single()
    if (data) {
      // temp replace karo real message se
      setMessages(m => m.map(x => x.id === tempId ? data : x))
    }

    inputRef.current?.focus()
  }

  const partnerName = partner?.role === 'buyer'
    ? (partner?.owner_name || 'Buyer')
    : (partner?.shop_name || partner?.owner_name || 'Seller')

  const getSenderName = (msg) => {
    if (msg.sender_id === user?.id) return profile?.owner_name || profile?.shop_name || 'Aap'
    return partnerName
  }

  // Date separator dikhao
  const getDateLabel = (dateStr) => {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Aaj'
    if (d.toDateString() === yesterday.toDateString()) return 'Kal'
    return d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })
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
          <button onClick={() => navigate(`/seller/${sellerId}`)} className="text-xs text-white/40 hover:text-white/70">
            Profile →
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 flex flex-col gap-1">
        {loading ? (
          <div className="text-white/30 text-xs text-center py-8">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-white/30">
            <div className="text-3xl mb-2">👋</div>
            <div className="text-sm">Conversation shuru karo!</div>
          </div>
        ) : messages.map((msg, i) => {
          const isMine = msg.sender_id === user?.id
          const prevMsg = messages[i - 1]
          const nextMsg = messages[i + 1]
          const showName = !prevMsg || prevMsg.sender_id !== msg.sender_id

          // Date separator
          const showDate = !prevMsg ||
            new Date(prevMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString()

          // Last message in a group — time + status dikhao
          const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id

          return (
            <div key={msg.id}>
              {/* Date separator */}
              {showDate && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] text-white/30 px-2">{getDateLabel(msg.created_at)}</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}

              <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} ${showName ? 'mt-3' : 'mt-0.5'}`}>
                {/* Sender naam */}
                {showName && (
                  <span className="text-[10px] text-white/30 mb-1 px-1">{getSenderName(msg)}</span>
                )}

                {/* Bubble */}
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? 'bg-[#f5a623] text-white rounded-br-sm'
                    : 'bg-white/10 text-white rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>

                {/* Time + status — sirf last message of group mein */}
                {isLastInGroup && (
                  <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-[10px] text-white/25">{formatTime(msg.created_at)}</span>
                    <MessageStatus msg={msg} userId={user?.id} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 bg-[#0f0a1e]">
        <input
          ref={inputRef}
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
