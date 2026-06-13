export default function ProductTile({ post, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-28 bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#f5a623]/50 transition-colors cursor-pointer"
    >
      {post.image_url ? (
        <img src={post.image_url} alt={post.caption} className="w-28 h-28 object-cover" loading="lazy" />
      ) : (
        <div className="w-28 h-28 bg-white/10 flex items-center justify-center text-3xl">🛍️</div>
      )}
      <div className="p-2">
        <div className="text-[11px] text-white font-medium truncate leading-tight">
          {post.caption?.slice(0, 28)}{post.caption?.length > 28 ? '...' : ''}
        </div>
        {post.price && (
          <div className="text-[11px] text-[#f5a623] font-medium mt-0.5">{post.price}</div>
        )}
        {post.available === false && (
          <div className="text-[10px] text-red-400 mt-0.5">Unavailable</div>
        )}
      </div>
    </div>
  )
}
