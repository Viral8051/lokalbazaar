export default function Toggle({ value, onChange, label, sublabel }) {
  return (
    <div className="flex items-center justify-between">
      {(label || sublabel) && (
        <div>
          {label && <div className="text-sm text-white font-medium">{label}</div>}
          {sublabel && <div className="text-xs text-white/40">{sublabel}</div>}
        </div>
      )}
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-[#f5a623]' : 'bg-white/20'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${value ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  )
}
