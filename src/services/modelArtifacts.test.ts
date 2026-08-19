import { readdir, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { scoreEmbeddingWithHead, validateClassifierHead, type LocalClassifierHead } from './localClassifier'

describe('trained local model artifacts', () => {
  async function filesUnder(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true })
    const nested = await Promise.all(entries.map((entry) => {
      const target = path.join(directory, entry.name)
      return entry.isDirectory() ? filesUnder(target) : /\.webp$/i.test(entry.name) ? [target] : []
    }))
    return nested.flat()
  }

  it('contains training samples for every class and trash subtype', async () => {
    const raw = await readFile('public/ai/prototypes.json', 'utf8')
    const model = JSON.parse(raw) as {
      version: number
      embeddingSize: number
      sampleCounts: Record<string, number>
      trashSubtypes: Record<string, number[][]>
      classifier: LocalClassifierHead
      samples?: unknown
    }
    const expected = ['trash', 'manhole', 'pothole', 'water_leak', 'broken_bench', 'other']
    expect(model.version).toBe(3)
    expect(model.sampleCounts.trash).toBeGreaterThanOrEqual(84)
    expect(expected.filter((label) => label !== 'trash').every((label) => model.sampleCounts[label] === 16)).toBe(true)
    expect(Object.keys(model.trashSubtypes)).toHaveLength(6)
    expect(Object.values(model.trashSubtypes).every((samples) => samples.every((sample) => sample.length === model.embeddingSize))).toBe(true)
    expect(validateClassifierHead(model.classifier, model.embeddingSize)).toBe(true)
    expect(model.classifier.classes).toEqual(expected)
    expect(model.samples).toBeUndefined()
    const probe = Array.from({ length: model.embeddingSize }, (_, index) => index === 0 ? 1 : 0)
    expect(scoreEmbeddingWithHead(probe, model.classifier).reduce((sum, item) => sum + item.score, 0)).toBeCloseTo(1, 6)
  })

  it('passes the independent gallery evaluation', async () => {
    const raw = await readFile('data/ai-evaluation.json', 'utf8')
    const report = JSON.parse(raw) as {
      correct: number
      total: number
      combinedCorrect: number
      combinedTotal: number
      validationAccuracy: number
      trashRecall: number
      cleanSpecificity: number
      trashSubtypeAccuracy: number
      split: Record<string, number>
      demoRegression: { correct: number; total: number }
    }
    expect(report.total).toBe(30)
    expect(report.split).toMatchObject({ training: 176, validation: 30, finalTest: 30, externalTrainingOnly: 36 })
    expect(report.correct).toBe(30)
    expect(report.combinedCorrect).toBe(34)
    expect(report.combinedTotal).toBe(34)
    expect(report.validationAccuracy).toBe(1)
    expect(report.demoRegression).toEqual(expect.objectContaining({ correct: 5, total: 5 }))
    expect(report.trashRecall).toBe(1)
    expect(report.cleanSpecificity).toBe(1)
    expect(report.trashSubtypeAccuracy).toBeGreaterThanOrEqual(0.9)
  })

  it('passes a frozen-model audit on unseen real-world trash photos', async () => {
    const audit = JSON.parse(await readFile('data/ai-unseen-audit.json', 'utf8')) as {
      modelVersion: number
      evaluated: number
      correct: number
      recall: number
      confidentCorrect: number
      results: Array<{ tacoImageId: number }>
    }
    const trainingMetadata = JSON.parse(await readFile('data/ai-v2/taco-training-sample.json', 'utf8')) as {
      images: Array<{ tacoImageId: number }>
    }
    const trainingIds = new Set(trainingMetadata.images.map((image) => image.tacoImageId))
    expect(audit.modelVersion).toBe(3)
    expect(audit.evaluated).toBe(20)
    expect(audit.correct).toBeGreaterThanOrEqual(16)
    expect(audit.recall).toBeGreaterThanOrEqual(0.8)
    expect(audit.confidentCorrect).toBeGreaterThanOrEqual(16)
    expect(audit.results.every((result) => !trainingIds.has(result.tacoImageId))).toBe(true)
  })

  it('keeps the 70/15/15 partitions balanced and free of duplicate images', async () => {
    const partitions = await Promise.all(['train', 'validation', 'final-test'].map((name) => filesUnder(path.join('data/ai-v2', name))))
    expect(partitions.map((files) => files.length)).toEqual([140, 30, 30])
    const hashes = await Promise.all(partitions.flat().map(async (file) => createHash('sha256').update(await readFile(file)).digest('hex')))
    expect(new Set(hashes).size).toBe(hashes.length)
    const benchmark = JSON.parse(await readFile('data/ai-v2/final-test/benchmark-index.json', 'utf8')) as Record<string, string[]>
    expect(Object.values(benchmark)).toHaveLength(6)
    expect(Object.values(benchmark).every((files) => files.length === 5)).toBe(true)
  })
})
