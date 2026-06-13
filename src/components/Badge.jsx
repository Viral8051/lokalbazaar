const variants = {
  available:  'bg-green-500/20 text-green-400',
  unavailable:'bg-red-500/20 text-red-400',
  premium:    'bg-[#f5a623]/20 text-[#f5a623]',
  free:       'bg-white/10 text-white/50',
  category:   'bg-white/10 text-white/60',
  new:        'bg-blue-500/20 text-blue-400',
}

export default function Badge({ label, variant = 'category', className = '' }) {
  return (
    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${variants[variant]} ${className}`}>
      {label}
    </span>
  )
}
