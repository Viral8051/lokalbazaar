import BottomNav from './BottomNav'
import SideNav from './SideNav'

export default function Layout({ children, active }) {
  return (
    <div className="min-h-screen bg-[#0f0a1e] flex">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex md:w-64 lg:w-72 flex-shrink-0">
        <SideNav active={active} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col pb-20 md:pb-0">
          {children}
        </div>
      </div>

      {/* Mobile bottom nav — hidden on desktop */}
      <div className="md:hidden">
        <BottomNav active={active} />
      </div>
    </div>
  )
}
