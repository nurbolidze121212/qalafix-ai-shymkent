import { readdir, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

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
      samples: Record<string, number[][]>
      trashSubtypes: Record<string, number[][]>
    }
    const expected = ['trash', 'manhole', 'pothole', 'water_leak', 'broken_bench', 'other']
    expect(model.version).toBe(2)
    expect(Object.keys(model.samples).sort()).toEqual([...expected].sort())
    expect(model.sampleCounts.trash).toBeGreaterThanOrEqual(84)
    expect(expected.filter((label) => label !== 'trash').every((label) => model.sampleCounts[label] === 16)).toBe(true)
    expect(Object.keys(model.trashSubtypes)).toHaveLength(6)
    expect(expected.every((label) => model.samples[label].every((sample) => sample.length === model.embeddingSize))).toBe(true)
  })

  it('passes the independent gallery evaluation', async () => {
    const raw = await readFile('data/ai-evaluation.json', 'utf8')
    const report = JSON.parse(raw) as { correct: number; total: number; trashRecall: number; cleanSpecificity: number; trashSubtypeAccuracy: number; split: Record<string, number> }
    expect(report.total).toBe(30)
    expect(report.split).toMatchObject({ training: 176, validation: 30, finalTest: 30, externalTrainingOnly: 36 })
    expect(report.trashRecall).toBeGreaterThanOrEqual(0.85)
    expect(report.cleanSpecificity).toBeGreaterThanOrEqual(0.75)
    expect(report.trashSubtypeAccuracy).toBeGreaterThanOrEqual(0.75)
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
