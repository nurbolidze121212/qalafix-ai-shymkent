import { Link, useLocation } from 'react-router-dom'
import { Camera } from 'lucide-react'

const links = [
  { to: '/', label: 'Главная' },
  { to: '/report', label: 'Сообщить' },
  { to: '/map', label: 'Карта' },
  { to: '/dashboard', label: 'Панель' },
  { to: '/technology', label: 'Технология' },
]

export default function Header() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-40 hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2" aria-label="QalaFix AI — на главную">
          <img src={`${import.meta.env.BASE_URL}qalafix.svg`} alt="" className="h-10 w-10 rounded-[13px]" />
          <div className="leading-tight">
            <div className="text-lg font-bold text-slate-900">QalaFix <span className="text-emerald-600">AI</span></div>
            <div className="text-[11px] font-medium text-slate-500">Городской помощник</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-sm font-medium" aria-label="Основная навигация">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-xl px-4 py-2 transition-colors hover:text-emerald-700 ${
                location.pathname === link.to ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          to="/report"
          className="app-button-primary min-h-11 px-4"
        >
          <Camera size={16} />
          Сообщить о проблеме
        </Link>
      </div>
    </header>
  )
}
