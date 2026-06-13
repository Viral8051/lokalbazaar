export default function SubscriptionBanner({ postCount = 0, plan = 'free', onUpgrade }) {
  if (plan === 'premium') return null
  const used = postCount
  const total = 10
  const left = Math.max(0, total - used)
  const percent = Math.min(100, (used / total) * 100)

  return (
    <div className="bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-[#f5a623]">Free Plan</span>
        <span className="text-xs text-white/50">{left} posts baaki</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
        <div
          className="bg-[#f5a623] h-1.5 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <button
        onClick={onUpgrade}
        className="w-full bg-[#f5a623] text-white text-xs font-medium py-2 rounded-lg hover:bg-[#e09520] transition-colors"
      >
        ✦ Premium lo — Unlimited posts + Priority listing
      </button>
    </div>
  )
}
