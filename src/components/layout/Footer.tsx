import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-slate-200 bg-white py-8 md:block hidden">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}qalafix.svg`} alt="" className="h-8 w-8 rounded-[10px]" />
            <span className="text-lg font-bold text-slate-900">QalaFix <span className="text-emerald-600">AI</span></span>
            <span className="text-xs text-slate-500">Шымкент</span>
          </div>
          <nav className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
            <Link to="/" className="transition hover:text-emerald-600">Главная</Link>
            <Link to="/report" className="transition hover:text-emerald-600">Сообщить о проблеме</Link>
            <Link to="/map" className="transition hover:text-emerald-600">Карта</Link>
            <Link to="/dashboard" className="transition hover:text-emerald-600">Панель управления</Link>
            <Link to="/technology" className="transition hover:text-emerald-600">Технология AI</Link>
          </nav>
          <div className="text-xs text-slate-500">
            © {year} QalaFix AI — Smart City Hackathon
          </div>
        </div>
      </div>
    </footer>
  )
}
