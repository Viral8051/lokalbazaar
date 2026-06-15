import { useTheme } from '../context/ThemeContext'
import { Sun, Moon  } from 'lucide-react';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${className}`}
      style={{
        background: 'var(--bg-surf)',
        border: '1px solid var(--border-md)',
        color: 'var(--text-sub)',
      }}
      title={theme === 'dark' ? 'Light mode pe switch karo' : 'Dark mode pe switch karo'}
    >
      <span className="text-sm">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</span>
      <span className="text-xs font-medium">
        {theme === 'dark' ? 'Light' : 'Dark'}
      </span>
    </button>
  )
}
