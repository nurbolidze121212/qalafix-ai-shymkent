import type { AnalysisResult, ModelClass, Severity, TrashSubtype } from '../types/report'
import type { MobileNet } from '@tensorflow-models/mobilenet'

export type AnalysisStage = 'loading-model' | 'reading-image' | 'classifying' | 'preparing-result'

type ProgressHandler = (stage: AnalysisStage, progress?: number) => void

type ClassTemplate = {
  title: string
  category: string
  severity: Severity
  description: string
  recommendedService: string
}

type PrototypeFile = {
  version: 2
  embeddingSize: number
  samples: Record<ModelClass, number[][]>
  trashSubtypes: Record<TrashSubtype, number[][]>
}

export const classTemplates: Record<ModelClass, ClassTemplate> = {
  trash: {
    title: 'Обнаружен мусор',
    category: 'Мусор',
    severity: 'medium',
    description: 'На территории обнаружен мусор. Требуется уборка и вывоз отходов.',
    recommendedService: 'Коммунальная служба',
  },
  manhole: {
    title: 'Открытый люк',
    category: 'Безопасность / ЖКХ',
    severity: 'critical',
    description: 'Обнаружен открытый люк без ограждения. Объект представляет непосредственную опасность и требует срочного реагирования.',
    recommendedService: 'Городская диспетчерская служба',
  },
  pothole: {
    title: 'Яма на дороге',
    category: 'Дороги',
    severity: 'high',
    description: 'На проезжей части обнаружено повреждение покрытия. Требуется осмотр и оперативный ремонт участка.',
    recommendedService: 'Городская дорожная служба',
  },
  water_leak: {
    title: 'Утечка воды',
    category: 'Водоснабжение',
    severity: 'high',
    description: 'Обнаружена видимая утечка воды. Требуется проверка коммуникаций и выезд аварийной службы.',
    recommendedService: 'Водоканал',
  },
  broken_bench: {
    title: 'Сломанная скамейка',
    category: 'Благоустройство',
    severity: 'low',
    description: 'Обнаружена повреждённая городская скамейка. Требуется ремонт или замена для безопасного использования.',
    recommendedService: 'Служба благоустройства',
  },
  other: {
    title: 'Городская проблема',
    category: 'Другое',
    severity: 'medium',
    description: 'Не удалось уверенно определить тип проблемы. Проверьте категорию и дополните описание перед отправкой.',
    recommendedService: 'Городская диспетчерская служба',
  },
}

const trashTemplates: Record<TrashSubtype, Pick<ClassTemplate, 'title' | 'severity' | 'description'>> = {
  scattered_litter: {
    title: 'Разбросанный мусор',
    severity: 'medium',
    description: 'На территории разбросаны бытовые отходы. Требуется уборка участка.',
  },
  garbage_bags: {
    title: 'Мусорные пакеты',
    severity: 'medium',
    description: 'Возле дороги или здания оставлены мусорные пакеты. Требуется вывоз отходов.',
  },
  overflowing_bin: {
    title: 'Переполненный контейнер',
    severity: 'medium',
    description: 'Контейнер переполнен, отходы находятся за его пределами. Требуется вывоз мусора и уборка территории.',
  },
  waste_pile: {
    title: 'Куча отходов',
    severity: 'high',
    description: 'Обнаружено скопление бытовых или крупногабаритных отходов. Требуется уборка и вывоз.',
  },
  illegal_dump: {
    title: 'Стихийная свалка',
    severity: 'high',
    description: 'Обнаружено несанкционированное скопление отходов. Требуется осмотр территории и вывоз мусора.',
  },
  single_litter: {
    title: 'Мусор на улице',
    severity: 'low',
    description: 'На общественной территории обнаружены отдельные предметы мусора. Требуется уборка участка.',
  },
}

export const demoScenarios: Array<{ id: ModelClass; label: string; hint: string }> = [
  { id: 'trash', label: 'Переполненный контейнер', hint: 'Главный сценарий' },
  { id: 'manhole', label: 'Открытый люк', hint: 'Критическая опасность' },
  { id: 'pothole', label: 'Яма на дороге', hint: 'Дорожная проблема' },
  { id: 'water_leak', label: 'Утечка воды', hint: 'Аварийная ситуация' },
  { id: 'broken_bench', label: 'Сломанная скамейка', hint: 'Благоустройство' },
]

let modelPromise: Promise<{
  mobilenet: MobileNet
  prototypes: PrototypeFile
}> | null = null

export class LocalModelUnavailableError extends Error {
  constructor(message = 'Локальная AI-модель недоступна') {
    super(message)
    this.name = 'LocalModelUnavailableError'
  }
}

async function loadLocalModel(onProgress?: ProgressHandler) {
  if (!modelPromise) {
    modelPromise = (async () => {
      onProgress?.('loading-model', 10)
      const [tf, { load }, prototypeResponse] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/mobilenet'),
        fetch('/ai/prototypes.json', { cache: 'force-cache' }),
      ])
      if (!prototypeResponse.ok) throw new LocalModelUnavailableError('Файл локальной модели не найден')
      const prototypes = await prototypeResponse.json() as PrototypeFile
      onProgress?.('loading-model', 45)
      await tf.ready()
      const mobilenet = await load({ version: 2, alpha: 0.5 })
      onProgress?.('loading-model', 100)
      return { mobilenet, prototypes }
    })().catch((error) => {
      modelPromise = null
      console.error('Local model loading failed', error)
      throw error instanceof LocalModelUnavailableError
        ? error
        : new LocalModelUnavailableError('Не удалось загрузить локальную AI-модель')
    })
  }
  return modelPromise
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Не удалось открыть изображение'))
    }
    image.src = url
  })
}

function cosineSimilarity(left: number[], right: number[]) {
  let dot = 0
  let leftNorm = 0
  let rightNorm = 0
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]
    leftNorm += left[index] ** 2
    rightNorm += right[index] ** 2
  }
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm) || 1)
}

function topKAverage(embedding: number[], samples: number[][], count = 3) {
  const scores = samples.map((sample) => cosineSimilarity(embedding, sample)).sort((a, b) => b - a)
  const selected = scores.slice(0, Math.min(count, scores.length))
  return selected.reduce((sum, score) => sum + score, 0) / selected.length
}

function createResult(
  modelClass: ModelClass,
  confidence: number,
  source: AnalysisResult['source'],
  trashSubtype?: TrashSubtype,
  needsReview = modelClass === 'other',
): AnalysisResult {
  const baseTemplate = classTemplates[modelClass]
  const template = modelClass === 'trash' && trashSubtype
    ? { ...baseTemplate, ...trashTemplates[trashSubtype] }
    : baseTemplate
  return {
    ...template,
    modelClass,
    trashSubtype,
    confidence,
    source,
    needsReview,
  }
}

export async function analyzeImage(file: File, onProgress?: ProgressHandler): Promise<AnalysisResult> {
  const { mobilenet, prototypes } = await loadLocalModel(onProgress)
  onProgress?.('reading-image', 100)
  const image = await fileToImage(file)
  onProgress?.('classifying', 20)
  const embeddingTensor = mobilenet.infer(image, true)
  const embedding = Array.from(await embeddingTensor.data())
  embeddingTensor.dispose()

  const candidates = (Object.entries(prototypes.samples) as Array<[ModelClass, number[][]]>)
    .filter(([, samples]) => samples.some((sample) => sample.length === embedding.length))
    .map(([modelClass, samples]) => ({ modelClass, score: topKAverage(embedding, samples) }))
  if (!candidates.length) throw new LocalModelUnavailableError('Локальная модель повреждена')

  candidates.sort((a, b) => b.score - a.score)
  const topCandidate = candidates[0]
  const runnerUp = candidates[1]
  const margin = Math.max(0, topCandidate.score - runnerUp.score)
  const scoreQuality = Math.max(0, Math.min(1, (topCandidate.score - 0.5) / 0.25))
  const separation = Math.max(0, Math.min(1, margin / 0.18))
  const confidence = Math.round(Math.max(45, Math.min(99, 45 + scoreQuality * 20 + separation * 34)))
  const needsReview = topCandidate.modelClass === 'other'
    || (topCandidate.modelClass === 'trash'
      ? topCandidate.score < 0.54
      : topCandidate.score < 0.56 || margin < 0.05)
  onProgress?.('classifying', 100)
  onProgress?.('preparing-result', 100)
  let trashSubtype: TrashSubtype | undefined
  if (topCandidate.modelClass === 'trash') {
    trashSubtype = (Object.entries(prototypes.trashSubtypes) as Array<[TrashSubtype, number[][]]>)
      .map(([subtype, samples]) => ({ subtype, score: topKAverage(embedding, samples, 2) }))
      .sort((a, b) => b.score - a.score)[0]?.subtype
  }
  return createResult(topCandidate.modelClass, confidence, 'local-model', trashSubtype, needsReview)
}

export async function warmupLocalModel() {
  await loadLocalModel()
}

export function analyzeDemoScenario(id: ModelClass): AnalysisResult {
  return createResult(id, id === 'trash' ? 94 : 91, 'demo-fallback', id === 'trash' ? 'overflowing_bin' : undefined)
}

export function createManualResult(id: ModelClass): AnalysisResult {
  return createResult(id, 100, 'manual')
}

export function getSourceLabel(source: AnalysisResult['source']) {
  if (source === 'local-model') return 'Анализ на устройстве'
  if (source === 'demo-fallback') return 'Демо-режим'
  return 'Выбрано вручную'
}
