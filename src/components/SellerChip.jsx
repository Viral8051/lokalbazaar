import Avatar from './Avatar'

export default function SellerChip({ seller, onClick, active = false }) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0"
    >
      <div className={`rounded-full transition-all ${active ? 'ring-2 ring-[#f5a623]' : ''}`}>
        <Avatar name={seller.shop_name} size="md" border={active} onClick={onClick} />
      </div>
      <span className="text-[10px] text-white/50 w-14 text-center truncate">
        {seller.shop_name?.split(' ')[0]}
      </span>
    </div>
  )
}
