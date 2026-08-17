import type { ModelClass } from '../types/report'

const STORAGE_KEY = 'qalafix-ai-feedback-v1'
const MAX_SAMPLES_PER_CLASS = 12
const classes: ModelClass[] = ['trash', 'manhole', 'pothole', 'water_leak', 'broken_bench', 'other']

export type LearnedSamples = Record<ModelClass, number[][]>

function emptySamples(): LearnedSamples {
  return {
    trash: [],
    manhole: [],
    pothole: [],
    water_leak: [],
    broken_bench: [],
    other: [],
  }
}

function validEmbedding(value: unknown): value is number[] {
  return Array.isArray(value)
    && value.length > 0
    && value.every((item) => typeof item === 'number' && Number.isFinite(item))
}

export function loadLearnedSamples(expectedSize?: number): LearnedSamples {
  const result = emptySamples()
  if (typeof localStorage === 'undefined') return result

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<LearnedSamples>
    for (const modelClass of classes) {
      const samples = Array.isArray(parsed[modelClass]) ? parsed[modelClass] : []
      result[modelClass] = samples
        .filter((sample): sample is number[] => validEmbedding(sample) && (!expectedSize || sample.length === expectedSize))
        .slice(-MAX_SAMPLES_PER_CLASS)
    }
  } catch {
    return emptySamples()
  }
  return result
}

export function saveLearnedEmbedding(modelClass: ModelClass, embedding: number[]) {
  if (!validEmbedding(embedding)) throw new Error('Некорректный обучающий пример')
  if (typeof localStorage === 'undefined') throw new Error('Локальное хранилище недоступно')

  const samples = loadLearnedSamples(embedding.length)
  const compactEmbedding = embedding.map((value) => Number(value.toFixed(5)))
  samples[modelClass] = [...samples[modelClass], compactEmbedding].slice(-MAX_SAMPLES_PER_CLASS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(samples))
  return samples[modelClass].length
}

export function getLearnedSampleCount() {
  const samples = loadLearnedSamples()
  return classes.reduce((total, modelClass) => total + samples[modelClass].length, 0)
}

export function clearLearnedSamples() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY)
}
