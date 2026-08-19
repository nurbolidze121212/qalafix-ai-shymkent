import { describe, expect, it } from 'vitest'
import { applyLearnedCorrections, scoreEmbeddingWithHead, validateClassifierHead, type LocalClassifierHead } from './localClassifier'

const head: LocalClassifierHead = {
  type: 'mlp',
  classes: ['trash', 'pothole'],
  inputSize: 2,
  hiddenSize: 2,
  hiddenKernel: [1, 0, 0, 1],
  hiddenBias: [0, 0],
  outputKernel: [2, -2, -2, 2],
  outputBias: [0, 0],
}

describe('local MLP classifier', () => {
  it('validates tensor dimensions and returns normalized class probabilities', () => {
    expect(validateClassifierHead(head, 2)).toBe(true)
    const scores = scoreEmbeddingWithHead([1, 0], head)
    expect(scores[0].modelClass).toBe('trash')
    expect(scores.reduce((sum, item) => sum + item.score, 0)).toBeCloseTo(1, 8)
  })

  it('rejects a damaged weight artifact', () => {
    expect(validateClassifierHead({ ...head, hiddenKernel: [1] }, 2)).toBe(false)
    expect(() => scoreEmbeddingWithHead([1, 0], { ...head, hiddenKernel: [1] })).toThrow(/Некорректная конфигурация/)
  })

  it('lets a confirmed local correction override a similar future image', () => {
    const adjusted = applyLearnedCorrections([
      { modelClass: 'pothole', score: 0.7 },
      { modelClass: 'trash', score: 0.2 },
      { modelClass: 'other', score: 0.1 },
    ], { trash: 1 })
    expect(adjusted[0].modelClass).toBe('trash')
    expect(adjusted.reduce((sum, item) => sum + item.score, 0)).toBeCloseTo(1, 8)

    const belowThreshold = applyLearnedCorrections([
      { modelClass: 'pothole', score: 0.7 },
      { modelClass: 'trash', score: 0.3 },
    ], { trash: 0.71 })
    expect(belowThreshold[0].modelClass).toBe('pothole')
  })
})
