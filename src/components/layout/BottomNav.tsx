import { Link, useLocation } from 'react-router-dom'
import { Home, Camera, Map, BarChart3 } from 'lucide-react'

const items = [
  { to: '/', label: 'Главная', icon: Home },
  { to: '/report', label: 'Сообщить', icon: Camera },
  { to: '/map', label: 'Карта', icon: Map },
  { to: '/dashboard', label: 'Панель', icon: BarChart3 },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Мобильная навигация">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
        {items.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex min-h-[3.85rem] min-w-16 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-semibold transition-colors ${
                active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span className={`flex h-8 w-10 items-center justify-center rounded-xl ${active ? 'bg-emerald-50' : ''}`}><Icon size={20} strokeWidth={active ? 2.5 : 2} /></span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
