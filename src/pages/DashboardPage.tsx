import { useMemo, useState } from 'react'
import { BarChart3, CheckCircle2, Clock3, Download, Inbox, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { loadReports, saveReports } from '../utils/storage'
import type { CityReport, ReportStatus } from '../types/report'
import { formatDate, severityColor, severityLabel, statusColor, statusLabel } from '../utils/formatters'
import { useDocumentTitle } from '../utils/useDocumentTitle'
import PageHeader from '../components/layout/PageHeader'

const statuses: ReportStatus[] = ['new', 'review', 'in_progress', 'resolved']
type DashboardTab = 'overview' | 'reports' | 'analytics'

export default function DashboardPage() {
  useDocumentTitle('QalaFix AI — Панель оператора')
  const [reports, setReports] = useState<CityReport[]>(() => loadReports())
  const [tab, setTab] = useState<DashboardTab>('overview')
  const [query, setQuery] = useState('')

  const kpi = useMemo(() => {
    const trash = reports.filter((item) => item.category === 'Мусор')
    return {
      total: reports.length,
      trash: trash.length,
      waiting: trash.filter((item) => item.status !== 'resolved').length,
      resolved: reports.filter((item) => item.status === 'resolved').length,
    }
  }, [reports])

  const categories = useMemo(() => {
    const counts: Record<string, number> = {}
    reports.forEach((item) => { counts[item.category] = (counts[item.category] ?? 0) + 1 })
    return Object.entries(counts).sort((left, right) => right[1] - left[1])
  }, [reports])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return [...reports]
      .filter((item) => !normalized || `${item.title} ${item.address} ${item.id}`.toLowerCase().includes(normalized))
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
  }, [query, reports])

  function changeStatus(id: string, status: ReportStatus) {
    const next = reports.map((item) => item.id === id ? { ...item, status } : item)
    setReports(next)
    saveReports(next)
  }

  function exportCSV() {
    const rows = [
      ['ID', 'Проблема', 'Категория', 'Адрес', 'Приоритет', 'Статус', 'Дата'],
      ...reports.map((item) => [item.id, item.title, item.category, item.address, severityLabel(item.severity), statusLabel(item.status), formatDate(item.createdAt)]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `qalafix-reports-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-in pb-4">
      <PageHeader title="Панель оператора" action={<button type="button" aria-label="Фильтры" className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-50"><SlidersHorizontal size={19} /></button>} />

      <div className="mb-5 hidden items-end justify-between md:flex">
        <div><div className="flex items-center gap-2"><h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Панель оператора</h1><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Демо-данные</span></div><p className="mt-1 text-sm text-slate-500">Обращения жителей и работа городских служб</p></div>
        <button type="button" onClick={exportCSV} className="app-button-secondary min-h-11"><Download size={16} /> Экспорт CSV</button>
      </div>

      <nav className="mb-5 grid grid-cols-3 border-b border-slate-200" aria-label="Разделы панели">
        {[
          ['overview', 'Обзор'],
          ['reports', 'Обращения'],
          ['analytics', 'Аналитика'],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id as DashboardTab)} className={`relative min-h-11 px-2 text-xs font-semibold transition-colors ${tab === id ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}>
            {label}{tab === id && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-emerald-600" />}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <div className="space-y-5">
          <Kpis kpi={kpi} />
          <CategoryBars categories={categories} total={kpi.total} />
          <section>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-950">Недавние обращения</h2><button type="button" onClick={() => setTab('reports')} className="min-h-10 px-2 text-[11px] font-semibold text-emerald-700">Смотреть все</button></div>
            <div className="space-y-2.5">{filtered.slice(0, 4).map((report) => <ReportCard key={report.id} report={report} onStatus={changeStatus} />)}{filtered.length === 0 && <EmptyReports />}</div>
          </section>
        </div>
      )}

      {tab === 'reports' && (
        <section className="space-y-4">
          <div className="flex gap-2"><label className="relative block min-w-0 flex-1"><span className="sr-only">Поиск обращений</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, адрес или проблема" className="app-field pl-10" /></label><button type="button" onClick={exportCSV} aria-label="Экспорт CSV" className="app-button-secondary w-12 shrink-0 px-0"><Download size={17} /></button></div>
          <div className="space-y-2.5 md:hidden">{filtered.map((report) => <ReportCard key={report.id} report={report} onStatus={changeStatus} />)}{filtered.length === 0 && <EmptyReports />}</div>
          <div className="app-card hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-[11px] text-slate-500"><tr><th className="px-4 py-3 font-semibold">Обращение</th><th className="px-4 py-3 font-semibold">Категория</th><th className="px-4 py-3 font-semibold">Приоритет</th><th className="px-4 py-3 font-semibold">Статус</th><th className="px-4 py-3 font-semibold">Дата</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((report) => <tr key={report.id} className="hover:bg-slate-50"><td className="px-4 py-3"><p className="font-semibold text-slate-900">{report.title}</p><p className="mt-1 text-[11px] text-slate-500">{report.address}</p></td><td className="px-4 py-3 text-xs text-slate-600">{report.category}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${severityColor(report.severity)}`}>{severityLabel(report.severity)}</span></td><td className="px-4 py-3"><StatusSelect report={report} onStatus={changeStatus} /></td><td className="px-4 py-3 text-[11px] text-slate-500">{formatDate(report.createdAt)}</td></tr>)}</tbody></table>
          </div>
        </section>
      )}

      {tab === 'analytics' && <div className="space-y-5"><Kpis kpi={kpi} /><CategoryBars categories={categories} total={kpi.total} /><div className="app-card p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><BarChart3 size={19} /></span><div><p className="text-sm font-bold text-slate-950">Демонстрационная аналитика</p><p className="mt-1 text-xs text-slate-500">Показатели построены только по обращениям в этом браузере.</p></div></div></div></div>}
    </div>
  )
}

function Kpis({ kpi }: { kpi: { total: number; trash: number; waiting: number; resolved: number } }) {
  const items = [
    ['Всего обращений', kpi.total, Inbox, 'text-slate-700'],
    ['По мусору', kpi.trash, Trash2, 'text-emerald-600'],
    ['Ожидают уборки', kpi.waiting, Clock3, 'text-amber-600'],
    ['Решено', kpi.resolved, CheckCircle2, 'text-emerald-600'],
  ] as const
  return <section className="grid grid-cols-2 gap-2.5 md:grid-cols-4">{items.map(([label, value, Icon, color]) => <article key={label} className="app-card p-3.5"><div className="flex items-start justify-between gap-2"><p className="text-[11px] font-medium leading-4 text-slate-500">{label}</p><Icon size={16} className={color} /></div><p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p></article>)}</section>
}

function CategoryBars({ categories, total }: { categories: Array<[string, number]>; total: number }) {
  return <section className="app-card p-4"><h2 className="text-sm font-bold text-slate-950">Обращения по категориям</h2><div className="mt-4 space-y-3">{categories.map(([name, count]) => { const percent = Math.round((count / Math.max(total, 1)) * 100); return <div key={name}><div className="flex justify-between text-[11px]"><span className="font-semibold text-slate-700">{name}</span><span className="text-slate-500">{count} · {percent}%</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${name === 'Мусор' ? 'bg-emerald-600' : 'bg-emerald-300'}`} style={{ width: `${percent}%` }} /></div></div>})}{categories.length === 0 && <p className="text-xs text-slate-500">Пока нет данных</p>}</div></section>
}

function ReportCard({ report, onStatus }: { report: CityReport; onStatus: (id: string, status: ReportStatus) => void }) {
  return <article className="app-card p-3"><div className="flex items-start gap-3"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] ${report.category === 'Мусор' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>{report.category === 'Мусор' ? <Trash2 size={20} /> : <Inbox size={20} />}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-950">{report.title}</p><p className="mt-1 truncate text-[11px] text-slate-500">{report.address}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${severityColor(report.severity)}`}>{severityLabel(report.severity)}</span></div><div className="mt-2 flex items-center justify-between gap-2"><span className="text-[10px] text-slate-400">{formatDate(report.createdAt)}</span><StatusSelect report={report} onStatus={onStatus} /></div></div></div></article>
}

function StatusSelect({ report, onStatus }: { report: CityReport; onStatus: (id: string, status: ReportStatus) => void }) {
  return <select aria-label={`Статус обращения ${report.title}`} value={report.status} onChange={(event) => onStatus(report.id, event.target.value as ReportStatus)} className={`min-h-9 rounded-xl border border-slate-200 px-2 text-[10px] font-semibold outline-none focus:border-emerald-500 ${statusColor(report.status)}`}>{statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
}

function EmptyReports() {
  return <div className="app-card flex flex-col items-center py-10 text-center"><Inbox size={27} className="text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-500">Обращений пока нет</p></div>
}
