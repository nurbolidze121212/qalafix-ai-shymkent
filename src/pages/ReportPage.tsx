import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  LocateFixed,
  MapPin,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import {
  analyzeDemoScenario,
  analyzeImage,
  createManualResult,
  demoScenarios,
  getSourceLabel,
  LocalModelUnavailableError,
  warmupLocalModel,
  type AnalysisStage,
} from '../services/analyzer'
import type { AnalysisResult, ModelClass, Severity } from '../types/report'
import { generateId, loadReports, saveReports } from '../utils/storage'
import { createDemoReport } from '../data/demoReports'
import { severityColor, severityLabel } from '../utils/formatters'
import { useDocumentTitle } from '../utils/useDocumentTitle'
import PageHeader from '../components/layout/PageHeader'

type Step = 'photo' | 'analysis' | 'confirm' | 'success'

const stageText: Record<AnalysisStage, string> = {
  'loading-model': 'Подготавливаем локальный AI',
  'reading-image': 'Обрабатываем фотографию',
  classifying: 'Определяем проблему',
  'preparing-result': 'Готовим обращение',
}

const categoryOptions: Array<{ modelClass: ModelClass; label: string }> = [
  { modelClass: 'trash', label: 'Мусор' },
  { modelClass: 'manhole', label: 'Безопасность / ЖКХ' },
  { modelClass: 'pothole', label: 'Дороги' },
  { modelClass: 'water_leak', label: 'Водоснабжение' },
  { modelClass: 'broken_bench', label: 'Благоустройство' },
  { modelClass: 'other', label: 'Другое' },
]

export default function ReportPage() {
  useDocumentTitle('QalaFix AI — Сообщить о проблеме')
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('photo')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [severity, setSeverity] = useState<Severity>('medium')
  const [address, setAddress] = useState('Шымкент, микрорайон Нурсат')
  const [coordinates, setCoordinates] = useState({ latitude: 42.315, longitude: 69.605 })
  const [stage, setStage] = useState<AnalysisStage>('loading-model')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [modelError, setModelError] = useState('')
  const [reportId, setReportId] = useState('')
  const [duplicateCount, setDuplicateCount] = useState(0)
  const [locating, setLocating] = useState(false)
  const [detailsExpanded, setDetailsExpanded] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void warmupLocalModel().catch(() => undefined)
    }, 200)
    return () => window.clearTimeout(timer)
  }, [])

  function selectFile(nextFile: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type)) {
      setError('Выберите изображение в формате JPG, PNG или WEBP.')
      return
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setError('Файл слишком большой. Максимальный размер — 10 МБ.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(String(reader.result))
      setFile(nextFile)
      setResult(null)
      setModelError('')
      setError('')
    }
    reader.onerror = () => setError('Не удалось открыть изображение. Попробуйте другой файл.')
    reader.readAsDataURL(nextFile)
  }

  async function runAnalysis() {
    if (!file) {
      setError('Сначала сделайте или выберите фотографию.')
      return
    }
    setStep('analysis')
    setProgress(0)
    setError('')
    try {
      const analysis = await analyzeImage(file, (nextStage, nextProgress) => {
        setStage(nextStage)
        setProgress(nextProgress ?? 0)
      })
      applyResult(analysis)
    } catch (analysisError) {
      const message = analysisError instanceof LocalModelUnavailableError
        ? analysisError.message
        : 'Не удалось проанализировать фотографию.'
      setModelError(`${message}. Выберите честный демо-режим или укажите категорию вручную.`)
      setStep('confirm')
      applyResult(createManualResult('other'), false)
    }
  }

  function applyResult(analysis: AnalysisResult, moveToConfirm = true) {
    setResult(analysis)
    setTitle(analysis.title)
    setDescription(analysis.description)
    setCategory(analysis.category)
    setSeverity(analysis.severity)
    setDetailsExpanded(false)
    if (moveToConfirm) setStep('confirm')
  }

  function selectDemo(modelClass: ModelClass) {
    applyResult(analyzeDemoScenario(modelClass))
    setModelError('')
    setError('')
  }

  function changeCategory(modelClass: ModelClass) {
    applyResult(createManualResult(modelClass))
    setDetailsExpanded(true)
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setError('Геолокация недоступна. Укажите адрес вручную.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude })
        setAddress(`Шымкент, координаты ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`)
        setLocating(false)
      },
      () => {
        setError('Доступ к геолокации запрещён. Укажите адрес вручную.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  function submitReport() {
    if (!title.trim() || !category || !address.trim()) {
      setError('Проверьте название, категорию и адрес обращения.')
      return
    }
    const id = generateId()
    const report = createDemoReport({
      id,
      title: title.trim(),
      description: description.trim() || 'Описание отсутствует.',
      category,
      severity,
      address: address.trim(),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      confidence: result?.confidence,
      analysisSource: result?.source ?? 'manual',
    })
    const reports = loadReports()
    const radius = 0.0045
    const duplicates = reports.filter((item) => item.category === report.category
      && Math.abs(item.latitude - report.latitude) < radius
      && Math.abs(item.longitude - report.longitude) < radius)
    saveReports([report, ...reports])
    setDuplicateCount(duplicates.length)
    setReportId(id)
    setStep('success')
  }

  function reset() {
    setStep('photo')
    setFile(null)
    setPreview(null)
    setResult(null)
    setError('')
    setModelError('')
    setReportId('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-4 pb-4">
      <PageHeader title={step === 'analysis' ? 'AI-анализ' : step === 'confirm' ? 'Результат анализа' : step === 'success' ? 'Готово' : 'Сообщить о проблеме'} />
      <header className="hidden md:block">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><Trash2 size={15} /> Чистый город начинается с одного фото</div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Сообщить о проблеме</h1>
        <p className="mt-2 text-sm text-slate-500">Сфотографируйте проблему — QalaFix AI подготовит обращение.</p>
      </header>
      <StepIndicator step={step} />

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} /> {error}
        </div>
      )}

      {step === 'photo' && (
        <section className="space-y-4">
          <div className="app-card overflow-hidden p-3">
            {preview ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-slate-100">
                <img src={preview} alt="Выбранная городская проблема" className="h-full w-full object-cover" />
                <button type="button" onClick={() => inputRef.current?.click()} className="absolute bottom-3 right-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/95 px-4 text-xs font-bold text-slate-800 shadow-lg backdrop-blur">
                  <RefreshCw size={16} /> Изменить
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-64 w-full flex-col items-center justify-center gap-4 rounded-[14px] border border-dashed border-emerald-300 bg-emerald-50/20 p-8 text-center transition-colors hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Camera size={28} /></span>
                <span>
                  <span className="block text-[15px] font-bold text-slate-950">Сфотографируйте проблему</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">или загрузите готовое фото</span>
                </span>
                <span className="app-button-secondary min-h-10 px-5">Выбрать фото</span>
              </button>
            )}
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(event) => event.target.files?.[0] && selectFile(event.target.files[0])}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-950">Быстрые примеры</h2><span className="text-[10px] font-semibold text-slate-400">ДЕМО-РЕЖИМ</span></div>
            <div className="grid grid-cols-3 gap-2.5">
              {demoScenarios.slice(0, 3).map((scenario) => (
                <button key={scenario.id} type="button" onClick={() => selectDemo(scenario.id)} className="min-w-0 text-left">
                  <img src={`${import.meta.env.BASE_URL}demo/${scenario.id}.webp`} alt="" className="aspect-square w-full rounded-[14px] border border-slate-200 object-cover" />
                  <span className="mt-1.5 block truncate text-[11px] font-semibold text-slate-700">{scenario.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="button" disabled={!file} onClick={runAnalysis} className="app-button-primary w-full">
            <Sparkles size={19} /> Начать AI-анализ
          </button>
          <p className="text-center text-[11px] leading-4 text-slate-400">Фото обрабатывается локально и не отправляется во внешний AI-сервис</p>
        </section>
      )}

      {step === 'analysis' && (
        <section aria-live="polite" className="space-y-4">
          {preview && <img src={preview} alt="Анализируемая городская проблема" className="aspect-[4/3] w-full rounded-[18px] border border-slate-200 object-cover" />}
          <div className="app-card p-5">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><LoaderCircle className="animate-spin" size={22} /></span><div><h2 className="text-sm font-bold text-slate-950">{stageText[stage]}</h2><p className="mt-1 text-xs text-slate-500">Локальная обработка на устройстве</p></div></div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${Math.max(8, progress)}%` }} /></div>
            <div className="mt-4 grid grid-cols-4 gap-1 text-center text-[9px] font-medium text-slate-400"><span>Модель</span><span>Фото</span><span>Проблема</span><span>Заявка</span></div>
          </div>
        </section>
      )}

      {step === 'confirm' && result && (
        <section className="space-y-4">
          {modelError && (
            <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Локальный AI недоступен</p>
              <p className="mt-1">{modelError}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {demoScenarios.map((scenario) => (
                  <button key={scenario.id} type="button" onClick={() => selectDemo(scenario.id)} className="min-h-11 rounded-xl border border-amber-300 bg-white px-3 text-xs font-semibold">Демо: {scenario.label}</button>
                ))}
              </div>
            </div>
          )}

          <div className="app-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><ShieldCheck size={20} /></span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{getSourceLabel(result.source)}</p>
                  <p className="text-sm font-bold text-slate-950">{result.needsReview ? 'Проверьте категорию' : 'Обращение готово'}</p>
                </div>
              </div>
              {preview && <img src={preview} alt="Проверяемая проблема" className="h-14 w-14 shrink-0 rounded-[12px] object-cover" />}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Обнаружена проблема</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950">{title}</h2>
              <div className="mt-4 grid gap-3 rounded-[14px] border border-slate-100 bg-slate-50/70 p-3 text-xs">
                <div className="flex justify-between gap-4"><span className="text-slate-500">Категория</span><strong className="text-slate-900">{category}</strong></div>
                <div className="flex justify-between gap-4"><span className="text-slate-500">Приоритет</span><strong className="text-slate-900">{severityLabel(severity)}</strong></div>
              </div>
              {result.needsReview && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                  <span>Категория выбрана предварительно</span>
                  <button type="button" onClick={() => setDetailsExpanded(true)} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 font-bold text-amber-900"><PencilLine size={14} /> Исправить</button>
                </div>
              )}
            </div>
          </div>

          {!detailsExpanded && (
            <>
              <div className="app-card p-4"><p className="text-[11px] font-semibold text-slate-500">Описание</p><p className="mt-2 text-sm leading-5 text-slate-800">{description}</p></div>
              <div className="app-card p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-semibold text-slate-500">Адрес</p><p className="mt-1 text-sm font-semibold text-slate-900">{address}</p></div><MapPin size={18} className="shrink-0 text-emerald-600" /></div></div>
              <button type="button" onClick={() => setDetailsExpanded(true)} className="mx-auto flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-emerald-700"><PencilLine size={15} /> Изменить детали</button>
            </>
          )}

          {detailsExpanded && <div className="app-card space-y-4 p-4 sm:p-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-800">Название</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="app-field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-800">Категория</span>
              <select value={result.modelClass} onChange={(event) => changeCategory(event.target.value as ModelClass)} className="app-field">
                {categoryOptions.map((option) => <option key={option.modelClass} value={option.modelClass}>{option.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-800">Описание</span>
              <textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="app-field py-3" />
            </label>
            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-800">Приоритет</span>
              <div className="flex flex-wrap gap-2">
                {(['low', 'medium', 'high', 'critical'] as Severity[]).map((item) => (
                  <button key={item} type="button" onClick={() => setSeverity(item)} className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${severity === item ? severityColor(item) : 'border-slate-200 bg-white text-slate-600'}`}>{severityLabel(item)}</button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-800">Адрес</span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input value={address} onChange={(event) => setAddress(event.target.value)} className="app-field min-w-0 flex-1" />
                <button type="button" disabled={locating} onClick={useLocation} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                  <LocateFixed size={18} /> {locating ? 'Определяем…' : 'Моё место'}
                </button>
              </div>
            </label>
          </div>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button type="button" onClick={() => setStep('photo')} className="app-button-secondary"><ArrowLeft size={18} /> Назад</button>
            <button type="button" onClick={submitReport} className="app-button-primary flex-1"><Upload size={18} /> Отправить обращение</button>
          </div>
        </section>
      )}

      {step === 'success' && (
        <section className="app-card p-6 text-center sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={32} /></span>
          <p className="mt-5 text-sm font-semibold text-emerald-700">Обращение отправлено</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Спасибо, что помогаете городу</h2>
          <p className="mt-2 text-sm text-slate-600">Номер обращения: <strong>{reportId}</strong></p>
          {duplicateCount > 0 && <p className="mx-auto mt-4 max-w-md rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Рядом найдено похожих обращений: {duplicateCount}. Они помогут службе оценить масштаб проблемы.</p>}
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <button type="button" onClick={() => navigate('/map')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 font-semibold text-white"><MapPin size={18} /> На карте</button>
            <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 font-semibold text-slate-700"><Check size={18} /> В панели</button>
            <button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 font-semibold text-slate-700"><ImagePlus size={18} /> Ещё обращение</button>
          </div>
        </section>
      )}
    </div>
  )
}

function StepIndicator({ step }: { step: Step }) {
  const active = step === 'photo' ? 1 : step === 'analysis' ? 2 : step === 'confirm' ? 3 : 4
  const labels = ['Фото', 'AI-анализ', 'Проверка', 'Готово']
  return (
    <ol aria-label="Этапы обращения" className="grid grid-cols-4 gap-1">
      {labels.map((label, index) => (
        <li key={label} className="min-w-0">
          <div className={`h-1.5 rounded-full ${index + 1 <= active ? 'bg-emerald-600' : 'bg-slate-200'}`} />
          <span className={`mt-1 block truncate text-[10px] font-medium sm:text-xs ${index + 1 <= active ? 'text-emerald-700' : 'text-slate-400'}`}>{label}</span>
        </li>
      ))}
    </ol>
  )
}
