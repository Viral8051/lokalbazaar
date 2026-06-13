export default function Avatar({ name, size = 'md', border = false, onClick }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-xl',
  }
  return (
    <div
      onClick={onClick}
      className={`${sizes[size]} rounded-full bg-[#f5a623]/20 flex items-center justify-center text-[#f5a623] font-bold flex-shrink-0
        ${border ? 'border-2 border-[#f5a623]' : 'border border-[#f5a623]/30'}
        ${onClick ? 'cursor-pointer hover:border-[#f5a623] transition-colors' : ''}
      `}
    >
      {initials}
    </div>
  )
}
