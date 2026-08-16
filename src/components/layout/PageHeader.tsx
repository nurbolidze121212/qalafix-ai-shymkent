import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export default function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <header className="relative -mx-1 mb-4 flex min-h-12 items-center justify-center md:hidden">
      <button type="button" onClick={() => navigate(-1)} aria-label="Назад" className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-xl text-slate-800 hover:bg-slate-50">
        <ArrowLeft size={21} />
      </button>
      <h1 className="px-12 text-center text-[15px] font-bold text-slate-950">{title}</h1>
      {action && <div className="absolute right-0">{action}</div>}
    </header>
  )
}
