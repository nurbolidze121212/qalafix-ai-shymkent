import { Link } from 'react-router-dom'
import { Camera, Map, Recycle, ShieldCheck, WandSparkles } from 'lucide-react'
import { useDocumentTitle } from '../utils/useDocumentTitle'

export default function HomePage() {
  useDocumentTitle('QalaFix AI — Чистый Шымкент')

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <section className="grid min-h-[calc(100dvh-7rem)] items-center gap-8 py-4 md:min-h-0 md:grid-cols-[1fr_0.88fr] md:py-12">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">
            <Recycle size={14} /> Городской сервис Шымкента
          </div>
          <h1 className="mt-5 text-[34px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#10203a] sm:text-5xl">
            Сфотографируйте проблему — <span className="text-emerald-600">AI подготовит обращение</span>
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-6 text-slate-600 md:text-base">
            Не нужно искать службу и составлять текст. QalaFix AI определит проблему, оценит приоритет и подготовит заявку.
          </p>
          <div className="mt-7 grid gap-3 sm:max-w-lg sm:grid-cols-2">
            <Link to="/report" className="app-button-primary"><Camera size={18} /> Сообщить о проблеме</Link>
            <Link to="/map" className="app-button-secondary"><Map size={18} /> Открыть карту</Link>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5">
            {[
              [WandSparkles, 'AI-анализ', 'Категория и приоритет'],
              [Map, 'Карта', 'Статус обращения'],
              [ShieldCheck, 'Контроль', 'Решение оператора'],
            ].map(([Icon, title, text]) => {
              const FeatureIcon = Icon as typeof WandSparkles
              return (
                <div key={String(title)} className="min-w-0">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><FeatureIcon size={17} /></span>
                  <p className="mt-2 text-xs font-bold text-slate-900">{String(title)}</p>
                  <p className="mt-1 hidden text-[11px] leading-4 text-slate-500 sm:block">{String(text)}</p>
                </div>
              )
            })}
          </div>
        </div>
        <CityIllustration />
      </section>

      <section className="border-t border-slate-100 py-8 md:py-12" aria-labelledby="how-title">
        <div className="mb-5 flex items-end justify-between">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Три шага</p><h2 id="how-title" className="mt-1 text-2xl font-extrabold tracking-tight text-[#10203a]">От фото до задачи</h2></div>
          <span className="hidden text-xs text-slate-500 md:block">Локально · бесплатно · без подписки</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ['01', 'Сделайте фото', 'Снимите мусор или другую городскую проблему.'],
            ['02', 'Проверьте результат', 'AI подготовит категорию, описание и приоритет.'],
            ['03', 'Отправьте заявку', 'Обращение появится на карте и у оператора.'],
          ].map(([number, title, text]) => (
            <article key={number} className="app-card p-4 md:p-5"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-extrabold text-white">{number}</span><div><h3 className="text-sm font-bold text-slate-950">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div></div></article>
          ))}
        </div>
      </section>
    </div>
  )
}

function CityIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-md self-end overflow-hidden rounded-[26px] bg-gradient-to-b from-sky-50/40 to-emerald-50/70 px-4 pt-8 md:self-center" aria-label="Иллюстрация чистого Шымкента">
      <svg viewBox="0 0 440 300" role="img" className="w-full" aria-labelledby="city-title">
        <title id="city-title">Чистый город, деревья и городской житель</title>
        <circle cx="64" cy="55" r="42" fill="#eef8ff" /><circle cx="358" cy="65" r="54" fill="#ecfdf5" />
        <path d="M0 235h440v65H0z" fill="#dff6e9" /><path d="M0 257c76-24 123-7 190-2 76 6 143-22 250 2v43H0z" fill="#c8efd8" />
        <g fill="#dcebf4"><path d="M42 147h62v94H42z"/><path d="M112 176h54v65h-54z"/><path d="M277 151h66v90h-66z"/><path d="M349 182h53v59h-53z"/></g>
        <g fill="#bcd8e9"><path d="M55 160h8v10h-8zm18 0h8v10h-8zm-18 20h8v10h-8zm18 0h8v10h-8zm217-16h9v11h-9zm20 0h9v11h-9zm-20 22h9v11h-9zm20 0h9v11h-9z"/></g>
        <g fill="#5bc783"><circle cx="36" cy="218" r="23"/><circle cx="75" cy="226" r="29"/><circle cx="366" cy="220" r="25"/><circle cx="405" cy="224" r="31"/></g>
        <g fill="#22a866"><path d="M34 226h5v32h-5zm368-1h5v34h-5z"/></g>
        <g><path d="M222 57l6 145h-12z" fill="#78aeca"/><path d="M207 94h30l-3 6h-24z" fill="#78aeca"/><path d="M211 126h22l-2 5h-18z" fill="#78aeca"/><path d="M202 204h40l7 37h-54z" fill="#d6e7f1"/></g>
        <g transform="translate(166 180)"><circle cx="20" cy="10" r="9" fill="#ffb526"/><path d="M11 22c8-6 17-6 25 0l-2 35H13z" fill="#00a66a"/><path d="M15 55l-4 33h8l3-27 4 27h8l-2-33z" fill="#29465b"/></g>
        <path d="M0 266h440" stroke="#a7dac0" strokeWidth="2" strokeDasharray="7 7"/>
      </svg>
    </div>
  )
}
