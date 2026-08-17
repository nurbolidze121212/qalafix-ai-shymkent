import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BrainCircuit,
  Camera,
  Check,
  ChevronRight,
  CircleDot,
  CloudOff,
  Code2,
  Database,
  ExternalLink,
  Eye,
  FileCheck2,
  Fingerprint,
  Gauge,
  Image,
  Layers3,
  LockKeyhole,
  Network,
  RefreshCw,
  ScanSearch,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Target,
  TestTube2,
  UserCheck,
} from 'lucide-react'
import { useDocumentTitle } from '../utils/useDocumentTitle'

const modelClasses = [
  { name: 'Мусор', code: 'trash', count: 96, accent: true },
  { name: 'Открытый люк', code: 'manhole', count: 16 },
  { name: 'Яма на дороге', code: 'pothole', count: 16 },
  { name: 'Утечка воды', code: 'water_leak', count: 16 },
  { name: 'Сломанная скамейка', code: 'broken_bench', count: 16 },
  { name: 'Другое', code: 'other', count: 16 },
]

const pipeline = [
  { number: '01', title: 'Фотография', text: 'Камера или галерея', icon: Camera },
  { number: '02', title: 'MobileNetV2', text: 'Извлекает признаки', icon: BrainCircuit },
  { number: '03', title: 'Вектор 1280', text: 'Числовое описание', icon: Fingerprint },
  { number: '04', title: 'Top-k поиск', text: 'Сравнение примеров', icon: ScanSearch },
  { number: '05', title: 'Обращение', text: 'Категория и приоритет', icon: FileCheck2 },
]

const roadmap = [
  {
    tag: 'Сейчас',
    title: 'Локальная адаптация',
    text: 'После ручного исправления сохраняется только числовой признак фотографии. Он помогает этому устройству точнее распознавать похожие случаи.',
    icon: Fingerprint,
  },
  {
    tag: 'Следующий этап',
    title: 'Датасет Шымкента',
    text: 'С согласия жителей собираем фотографии и подтверждённые категории, удаляем дубликаты и чувствительные данные, проверяем разметку.',
    icon: Database,
  },
  {
    tag: 'Масштабирование',
    title: 'Собственная модель',
    text: 'Переобучаем и сравниваем версии на закрытом тесте. Публикуем только модель, которая измеримо лучше и остаётся быстрой на телефоне.',
    icon: Network,
  },
]

export default function TechnologyPage() {
  useDocumentTitle('Технология QalaFix AI — как работает модель')

  return (
    <div className="mx-auto max-w-6xl animate-fade-in pb-8 md:pb-12">
      <section className="relative isolate overflow-hidden rounded-[28px] bg-[#071a2d] px-5 py-6 text-white shadow-[0_24px_70px_rgba(7,26,45,0.18)] sm:px-8 sm:py-9 md:rounded-[36px] md:px-12 md:py-12">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(52,211,153,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,.12)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="pointer-events-none absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 left-1/3 -z-10 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-200">
            <CircleDot size={13} className="fill-emerald-300" /> Model card · v2.0
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300">
            <CloudOff size={15} className="text-emerald-300" /> Работает без платного AI API
          </div>
        </div>

        <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-bold text-emerald-300">Технология QalaFix AI</p>
            <h1 className="mt-3 max-w-3xl text-[38px] font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl md:text-[68px]">
              Городская проблема становится данными.
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-300 sm:text-base">
              QalaFix AI анализирует фотографию прямо на устройстве, находит визуально похожие подтверждённые примеры и превращает результат в понятное обращение.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {['TensorFlow.js', 'MobileNetV2', 'On-device AI', '6 классов'].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200">{item}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {[
              ['176', 'обучающих примеров'],
              ['1280', 'признаков в векторе'],
              ['29/30', 'закрытый финальный тест'],
              ['0', 'фото отправляется в AI API'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm sm:p-5">
                <p className="text-2xl font-black tracking-tight text-white sm:text-3xl">{value}</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-400 sm:text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16" aria-labelledby="architecture-title">
        <SectionHeading
          eyebrow="Архитектура"
          title="Что происходит после нажатия «Начать анализ»"
          text="Это реальная схема текущей версии, без скрытой симуляции и облачной подмены результата."
        />

        <div className="mt-7 grid gap-2 md:grid-cols-5">
          {pipeline.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="relative flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:block md:min-h-44 md:p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={21} /></div>
                <div className="min-w-0 md:mt-8">
                  <p className="text-[10px] font-black tracking-[0.16em] text-emerald-700">{step.number}</p>
                  <h3 className="mt-1 text-sm font-extrabold text-slate-950">{step.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{step.text}</p>
                </div>
                {index < pipeline.length - 1 && <ChevronRight aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white text-slate-300 md:block" size={22} />}
              </div>
            )
          })}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"><Layers3 size={21} /></span>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight text-slate-950">Почему MobileNetV2</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Это лёгкая свёрточная сеть, созданная для мобильных устройств. Мы используем вариант <strong className="text-slate-800">alpha 0.5</strong> как извлекатель признаков: он не выдаёт готовый городской класс, а превращает изображение в компактный вектор.
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"><Target size={21} /></span>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight text-slate-950">Как выбирается ответ</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Вектор сравнивается с обучающими примерами по косинусной близости. Среднее трёх ближайших совпадений определяет класс; слабый или спорный результат отправляется пользователю на проверку.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-[28px] bg-slate-50 px-5 py-8 sm:px-8 md:px-10 md:py-12" aria-labelledby="dataset-title">
        <div className="grid gap-9 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <SectionHeading
              eyebrow="Данные"
              title="Чему обучен AI сейчас"
              text="Обучение строится на фотографиях городской среды. После обработки в рабочую модель попадают не сами снимки, а их нормализованные числовые признаки."
            />
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-900">Разделение данных</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">70 / 15 / 15</span>
              </div>
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-200" aria-label="70 процентов обучение, 15 валидация, 15 финальный тест">
                <span className="w-[70%] bg-emerald-600" /><span className="w-[15%] bg-sky-500" /><span className="w-[15%] bg-amber-400" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[['176', 'обучение'], ['30', 'валидация'], ['30', 'финальный тест']].map(([value, label]) => (
                  <div key={label}><p className="text-lg font-black text-slate-950">{value}</p><p className="text-[10px] text-slate-500">{label}</p></div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {modelClasses.map((item) => (
              <article key={item.code} className={`rounded-2xl border p-4 sm:p-5 ${item.accent ? 'border-emerald-200 bg-emerald-600 text-white shadow-[0_12px_30px_rgba(5,150,105,0.17)]' : 'border-slate-200 bg-white text-slate-950'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold">{item.name}</h3>
                    <p className={`mt-1 font-mono text-[10px] ${item.accent ? 'text-emerald-100' : 'text-slate-400'}`}>{item.code}</p>
                  </div>
                  <span className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-sm font-black ${item.accent ? 'bg-white/15' : 'bg-slate-100 text-slate-800'}`}>{item.count}</span>
                </div>
                {item.accent && <p className="mt-4 border-t border-white/20 pt-3 text-[11px] leading-5 text-emerald-50">6 подтипов: разбросанный мусор, пакеты, переполненный контейнер, куча отходов, свалка и одиночный мусор.</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16" aria-labelledby="origin-title">
        <SectionHeading
          eyebrow="Происхождение"
          title="Откуда взялась модель"
          text="QalaFix AI не выдаёт чужую архитектуру за собственную. Основа открытая, а городские категории, примеры, правила приоритета и пользовательский сценарий разработаны для проекта."
        />

        <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <SourceCard
            icon={Code2}
            title="TensorFlow.js"
            type="Среда выполнения"
            text="Открытая библиотека Google для запуска машинного обучения в браузере и Node.js."
            href="https://www.tensorflow.org/js"
          />
          <SourceCard
            icon={BrainCircuit}
            title="MobileNetV2"
            type="Базовая архитектура"
            text="Официальная предобученная модель из пакета TensorFlow.js Models."
            href="https://github.com/tensorflow/tfjs-models/tree/master/mobilenet"
          />
          <SourceCard
            icon={FileCheck2}
            title="Научная статья"
            type="Описание сети"
            text="MobileNetV2: Inverted Residuals and Linear Bottlenecks, CVPR 2018."
            href="https://arxiv.org/abs/1801.04381"
          />
          <SourceCard
            icon={Image}
            title="TACO"
            type="Данные о мусоре"
            text="36 размеченных фотографий мусора в реальной среде добавлены только в обучающую часть."
            href="https://github.com/pedropro/TACO"
          />
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-xs leading-5 text-slate-600 sm:p-5">
          <ShieldCheck size={19} className="mt-0.5 shrink-0 text-sky-700" />
          <p><strong className="text-slate-900">Контроль происхождения:</strong> для TACO хранится точный список исходных URL и метаданных. Внешние изображения не смешиваются с validation и final-test, поэтому проверка не видит обучающие фотографии заранее.</p>
        </div>
      </section>

      <section className="grid overflow-hidden rounded-[28px] border border-slate-200 lg:grid-cols-2" aria-labelledby="learning-title">
        <div className="bg-[#0b2136] p-6 text-white sm:p-9 md:p-10">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">Human in the loop</p>
          <h2 id="learning-title" className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">AI учится на исправлении, а не на своей ошибке.</h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">Автоматически принимать собственный ответ за истину опасно: одна ошибка начала бы усиливать следующую. Поэтому новый пример появляется только после того, как человек выбрал правильную категорию.</p>
          <div className="mt-7 space-y-3">
            {[
              [Eye, 'AI предлагает результат'],
              [UserCheck, 'Пользователь подтверждает или исправляет'],
              [Fingerprint, 'Сохраняется числовой вектор, не фотография'],
              [RefreshCw, 'Похожие снимки распознаются точнее'],
            ].map(([ItemIcon, text], index) => {
              const Icon = ItemIcon as typeof Eye
              return (
                <div key={String(text)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-300"><Icon size={16} /></span>
                  <p className="text-xs font-semibold text-slate-100"><span className="mr-2 font-mono text-emerald-300">0{index + 1}</span>{String(text)}</p>
                </div>
              )
            })}
          </div>
        </div>
        <div className="bg-white p-6 sm:p-9 md:p-10">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">Приватность сейчас</p>
          <div className="mt-6 space-y-6">
            {[
              [LockKeyhole, 'Фотография не отправляется во внешний AI-сервис', 'Распознавание выполняется в браузере или внутри Android-приложения.'],
              [ServerCog, 'Нет скрытого облачного обучения', 'Исправления остаются в локальном хранилище конкретного устройства.'],
              [Gauge, 'Не обещаем 100% точность', 'Уверенность — техническая оценка. Неоднозначный ответ всегда можно исправить вручную.'],
            ].map(([ItemIcon, title, text]) => {
              const Icon = ItemIcon as typeof LockKeyhole
              return (
                <div key={String(title)} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={19} /></span>
                  <div><h3 className="text-sm font-extrabold text-slate-950">{String(title)}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{String(text)}</p></div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16" aria-labelledby="quality-title">
        <div className="grid items-start gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <SectionHeading
              eyebrow="Проверка качества"
              title="Точность измеряем отдельно от обучения"
              text="Финальные фотографии не использовались при создании прототипов. Поэтому результат показывает обобщение, а не запоминание файлов."
            />
            <p className="mt-4 text-[11px] leading-5 text-slate-400">Результаты относятся к текущему контролируемому набору MVP и не являются заявлением о точности на всех фотографиях города.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['96,7%', 'Общая точность', '29 из 30 на final-test'],
              ['96%', 'Полнота «Мусор»', 'на закрытой выборке'],
              ['100%', 'Чистые сцены', '5 из 5 не стали мусором'],
            ].map(([value, label, detail]) => (
              <div key={label} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                <TestTube2 size={19} className="text-emerald-600" />
                <p className="mt-6 text-3xl font-black tracking-tight text-slate-950">{value}</p>
                <h3 className="mt-2 text-sm font-extrabold text-slate-900">{label}</h3>
                <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-8 sm:px-8 md:px-10 md:py-12" aria-labelledby="roadmap-title">
        <SectionHeading
          eyebrow="Развитие"
          title="Как QalaFix AI станет городской моделью"
          text="Цель — не бесконтрольно собирать все снимки, а построить проверенный датасет реальных условий Шымкента."
        />
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {roadmap.map((item, index) => {
            const Icon = item.icon
            return (
              <article key={item.tag} className="relative overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 shadow-sm">{item.tag}</span><span className="font-mono text-xs text-slate-300">0{index + 1}</span></div>
                <span className="mt-8 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white"><Icon size={20} /></span>
                <h3 className="mt-4 text-lg font-extrabold tracking-tight text-slate-950">{item.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">{item.text}</p>
              </article>
            )
          })}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {['Согласие на использование фото', 'Удаление EXIF и персональных данных', 'Двойная проверка разметки', 'Версионирование и откат модели'].map((item) => (
            <div key={item} className="flex items-start gap-2 rounded-xl bg-emerald-50/70 p-3 text-xs font-semibold leading-5 text-slate-700"><Check size={15} className="mt-0.5 shrink-0 text-emerald-700" />{item}</div>
          ))}
        </div>
      </section>

      <section className="mt-12 overflow-hidden rounded-[28px] bg-emerald-600 px-5 py-8 text-white shadow-[0_20px_50px_rgba(5,150,105,0.2)] sm:px-8 md:flex md:items-center md:justify-between md:gap-10 md:px-10 md:py-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-100"><Sparkles size={16} /> Проверить технологию в действии</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Одна фотография — полный сценарий обращения.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">Сделайте снимок, проверьте классификацию и при необходимости исправьте AI. Именно подтверждённое исправление становится новым локальным примером.</p>
        </div>
        <Link to="/report" className="mt-6 inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-[14px] bg-white px-5 text-sm font-extrabold text-emerald-700 shadow-lg transition-colors hover:bg-emerald-50 md:mt-0 md:w-auto">
          Открыть AI-анализ <ArrowRight size={17} />
        </Link>
      </section>
    </div>
  )
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#10203a] sm:text-3xl md:text-4xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  )
}

function SourceCard({ icon: Icon, title, type, text, href }: { icon: typeof Code2; title: string; type: string; text: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="group flex min-h-56 flex-col rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-colors duration-200 hover:border-emerald-300">
      <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={20} /></span><ExternalLink size={15} className="text-slate-300 transition-colors group-hover:text-emerald-600" /></div>
      <p className="mt-7 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">{type}</p>
      <h3 className="mt-1 text-lg font-extrabold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
    </a>
  )
}
