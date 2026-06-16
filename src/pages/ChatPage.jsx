import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

// ── Helpers ────────────────────────────────────────────────────
const initials   = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
const timeAgo    = (d) => {
  const s = (Date.now() - new Date(d)) / 1000
  if (s < 60) return 'abhi'
  if (s < 3600) return `${Math.floor(s/60)}m`
  if (s < 86400) return `${Math.floor(s/3600)}h`
  return `${Math.floor(s/86400)}d`
}
const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''
const dateLabel  = (d) => {
  const today = new Date(), yest = new Date(); yest.setDate(today.getDate() - 1)
  if (new Date(d).toDateString() === today.toDateString()) return 'Aaj'
  if (new Date(d).toDateString() === yest.toDateString()) return 'Kal'
  return new Date(d).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })
}

// ✓ ✓✓ ✓✓(blue) ticks
function MessageStatus({ msg, userId }) {
  if (msg.sender_id !== userId) return null
  const isTemp = msg.id?.toString().startsWith('temp-')
  if (isTemp)       return <span className="text-[10px] text-theme/40 ml-1" title="Sending">✓</span>
  if (msg.read)     return <span className="text-[10px] text-[#4fc3f7] ml-1" title="Seen">✓✓</span>
  if (msg.delivered)return <span className="text-[10px] text-theme/70 ml-1" title="Delivered">✓✓</span>
  return              <span className="text-[10px] text-theme/40 ml-1" title="Sent">✓</span>
}

// ── Chat List ──────────────────────────────────────────────────
export function ChatListPage() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [convs, setConvs]     = useState([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
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

    const map = {}
    for (const msg of (data || [])) {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      const partner   = msg.sender_id === user.id ? msg.receiver   : msg.sender
      if (!map[partnerId]) {
        map[partnerId] = {
          partnerId,
          displayName: partner?.role === 'buyer'
            ? (partner?.owner_name || 'Buyer')
            : (partner?.shop_name  || partner?.owner_name || 'Seller'),
          lastMsg:      msg.text,
          time:         msg.created_at,
          unread:       0,
          lastSenderId: msg.sender_id,
        }
      }
      if (msg.receiver_id === user.id && !msg.read) {
        map[partnerId].unread += 1
      }
    }
    setConvs(Object.values(map))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  // Realtime — INSERT ya UPDATE dono pe refresh karo
  useEffect(() => {
    if (!user) return
    const ch = supabase.channel('chatlist-' + user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => {
        const m = p.new
        if (m.sender_id === user.id || m.receiver_id === user.id) fetchConversations()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (p) => {
        const m = p.new
        if (m.sender_id === user.id || m.receiver_id === user.id) fetchConversations()
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user, fetchConversations])

  return (
    <Layout active="chat">
      <div className="border-b border-theme" style={{padding:'12px 16px'}}>
        <h1 className="text-base font-semibold text-theme">Messages</h1>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex flex-col gap-3" style={{padding:'12px 16px'}}>
            {[1,2,3].map(i => <div key={i} className="h-16 bg-surf rounded-xl animate-pulse"/>)}
          </div>
        ) : convs.length === 0 ? (
          <div className="text-center py-20 text-theme/30">
            <div className="text-4xl mb-3">💬</div>
            <div className="text-sm">Koi message nahi abhi</div>
          </div>
        ) : convs.map(conv => (
          <div key={conv.partnerId} onClick={() => navigate(`/chat/${conv.partnerId}`)}
            className={`flex items-center gap-3 border-b border-theme cursor-pointer transition-colors ${
              conv.unread > 0 ? 'bg-accent/8 hover:bg-accent/12' : 'hover:bg-surf'
            }`} style={{padding:'12px 16px'}}>
            {/* Avatar + badge */}
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold text-sm">
                {initials(conv.displayName)}
              </div>
              {conv.unread > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-[9px] text-theme font-bold leading-none">{conv.unread > 9 ? '9+' : conv.unread}</span>
                </div>
              )}
            </div>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className={`text-sm truncate ${conv.unread > 0 ? 'font-semibold text-theme' : 'font-medium text-theme/80'}`}>
                {conv.displayName}
              </div>
              <div className={`text-xs truncate mt-0.5 ${conv.unread > 0 ? 'text-theme/70 font-medium' : 'text-theme/40'}`}>
                {conv.lastSenderId === user.id ? <span className="text-theme/30">✓ </span> : null}{conv.lastMsg}
              </div>
            </div>
            {/* Time */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className={`text-[10px] ${conv.unread > 0 ? 'text-accent font-medium' : 'text-theme/30'}`}>
                {timeAgo(conv.time)}
              </span>
              {conv.unread > 0 && <div className="w-2 h-2 rounded-full bg-accent"/>}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}

// ── Chat Window ────────────────────────────────────────────────
export function ChatWindowPage() {
  const { sellerId }   = useParams()
  const { user, profile } = useAuth()
  const navigate       = useNavigate()
  const [partner, setPartner]   = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText]         = useState('')
  const [loading, setLoading]   = useState(true)
  const bottomRef  = useRef()
  const inputRef   = useRef()
  const channelRef = useRef()

  // Mark all incoming messages as delivered + read
  const markAllRead = useCallback(async () => {
    if (!user || !sellerId) return
    const { data: unread } = await supabase
      .from('messages')
      .select('id')
      .eq('receiver_id', user.id)
      .eq('sender_id', sellerId)
      .eq('read', false)

    if (!unread?.length) return

    await supabase
      .from('messages')
      .update({ read: true, delivered: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', sellerId)
      .eq('read', false)

    // Local state bhi update karo — highlight turant hato
    setMessages(m => m.map(msg =>
      msg.sender_id === sellerId && msg.receiver_id === user.id
        ? { ...msg, read: true, delivered: true }
        : msg
    ))
  }, [user, sellerId])

  useEffect(() => {
    if (!user) return
    fetchPartner()
    fetchMessages()
    setupRealtime()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [sellerId, user])

  // Tab visible hone pe bhi markAllRead
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') markAllRead() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [markAllRead])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function setupRealtime() {
  const ch = supabase
    .channel(`chat-${[user.id, sellerId].sort().join('-')}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (p) => {
      console.log('🟢 INSERT received:', p.new)
      const msg = p.new
      const isThis = (msg.sender_id === user.id && msg.receiver_id === sellerId) ||
                     (msg.sender_id === sellerId && msg.receiver_id === user.id)
      if (!isThis) return

      if (msg.receiver_id === user.id) {
        await supabase.from('messages').update({ read: true, delivered: true }).eq('id', msg.id)
        msg.read = true; msg.delivered = true
      }

      setMessages(m => {
        const noTemp = m.filter(x => !x.id?.toString().startsWith('temp-'))
        if (noTemp.find(x => x.id === msg.id)) return m
        return [...noTemp, msg]
      })
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (p) => {
      console.log('🔵 UPDATE received:', p.new)
      const updated = p.new
      const isThis = (updated.sender_id === user.id && updated.receiver_id === sellerId) ||
                     (updated.sender_id === sellerId && updated.receiver_id === user.id)
      if (!isThis) return
      setMessages(m => m.map(x => x.id === updated.id ? { ...x, ...updated } : x))
    })
    .subscribe((status) => {
      console.log('📡 Realtime status:', status)
    })

  channelRef.current = ch
}

  async function fetchPartner() {
    const { data } = await supabase
      .from('profiles').select('id, shop_name, owner_name, role').eq('id', sellerId).maybeSingle()
    setPartner(data)
  }

  async function fetchMessages() {
    if (!user) return
    const { data } = await supabase
      .from('messages').select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoading(false)
    // Fetch ke baad read mark karo
    await markAllRead()
  }

  async function sendMessage() {
    if (!text.trim() || !user) return
    const msg = { sender_id: user.id, receiver_id: sellerId, text: text.trim(), read: false, delivered: false, created_at: new Date().toISOString() }
    setText('')
    const tempId = 'temp-' + Date.now()
    setMessages(m => [...m, { ...msg, id: tempId }])

    const { data } = await supabase.from('messages').insert(msg).select().single()
    if (data) {
      setMessages(m => m.map(x => x.id === tempId ? data : x))
    }
    inputRef.current?.focus()
  }

  const partnerName = partner?.role === 'buyer'
    ? (partner?.owner_name || 'Buyer')
    : (partner?.shop_name  || partner?.owner_name || 'Seller')

  const getSenderName = (msg) =>
    msg.sender_id === user?.id
      ? (profile?.owner_name || profile?.shop_name || 'Aap')
      : partnerName

  return (
    <Layout active="chat">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-theme sticky top-0 bg-theme z-10" style={{padding:'12px 16px'}}>
        <button onClick={() => navigate('/chat')} className="text-theme/60 hover:text-theme text-xl">←</button>
        <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0">
          {initials(partnerName)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-theme">{partnerName || '...'}</div>
          <div className="text-[10px] text-theme/40">{partner?.role === 'seller' ? '🏪 Seller' : '🛒 Buyer'}</div>
        </div>
        {partner?.role === 'seller' && (
          <button onClick={() => navigate(`/seller/${sellerId}`)} className="text-xs text-theme/40 hover:text-theme/70">Profile →</button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 flex flex-col gap-1" style={{padding:'12px 16px'}}>
        {loading ? (
          <div className="text-theme/30 text-xs text-center py-8">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-theme/30">
            <div className="text-3xl mb-2">👋</div>
            <div className="text-sm">Conversation shuru karo!</div>
          </div>
        ) : messages.map((msg, i) => {
          const isMine       = msg.sender_id === user?.id
          const prevMsg      = messages[i - 1]
          const nextMsg      = messages[i + 1]
          const showName     = !prevMsg || prevMsg.sender_id !== msg.sender_id
          const isLastInGrp  = !nextMsg || nextMsg.sender_id !== msg.sender_id
          const showDate     = !prevMsg || new Date(prevMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString()

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-input"/>
                  <span className="text-[10px] text-theme/30 px-2">{dateLabel(msg.created_at)}</span>
                  <div className="flex-1 h-px bg-input"/>
                </div>
              )}
              <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} ${showName ? 'mt-3' : 'mt-0.5'}`}>
                {showName && (
                  <span className="text-[10px] text-theme/30 mb-1 px-1">{getSenderName(msg)}</span>
                )}
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  isMine ? 'bg-accent text-theme rounded-br-sm' : 'bg-input text-theme rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                {isLastInGrp && (
                  <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-[10px] text-theme/25">{formatTime(msg.created_at)}</span>
                    <MessageStatus msg={msg} userId={user?.id}/>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-theme bg-theme">
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Message karo..."
          className="flex-1 bg-input border border-theme rounded-full px-4 py-2.5 text-sm text-theme outline-none focus:border-accent transition-colors placeholder:text-theme/30"/>
        <button onClick={sendMessage} disabled={!text.trim()}
          className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-theme text-lg disabled:opacity-40 hover:bg-accent transition-colors flex-shrink-0">
          ➤
        </button>
      </div>
    </Layout>
  )
}
