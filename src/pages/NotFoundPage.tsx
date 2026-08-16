import { ArrowLeft, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../utils/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('QalaFix AI — Страница не найдена')
  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><MapPin size={26} /></span>
      <p className="mt-5 text-sm font-bold text-emerald-700">Ошибка 404</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-950">Страница не найдена</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">Вернитесь на главную и продолжите работу с городскими обращениями.</p>
      <Link to="/" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-bold text-white"><ArrowLeft size={18} /> На главную</Link>
    </section>
  )
}
