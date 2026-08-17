import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearLearnedSamples,
  getLearnedSampleCount,
  loadLearnedSamples,
  saveLearnedEmbedding,
} from './learningStore'

beforeEach(clearLearnedSamples)

describe('learning store', () => {
  it('stores a corrected embedding only in the selected class', () => {
    expect(saveLearnedEmbedding('pothole', [0.123456, 0.5])).toBe(1)
    expect(loadLearnedSamples(2).pothole).toEqual([[0.12346, 0.5]])
    expect(loadLearnedSamples(2).trash).toEqual([])
    expect(getLearnedSampleCount()).toBe(1)
  })

  it('ignores samples with a different embedding size', () => {
    saveLearnedEmbedding('trash', [0.1, 0.2, 0.3])
    expect(loadLearnedSamples(2).trash).toEqual([])
  })

  it('keeps storage bounded for each category', () => {
    for (let index = 0; index < 15; index += 1) {
      saveLearnedEmbedding('trash', [index, index + 1])
    }
    expect(loadLearnedSamples(2).trash).toHaveLength(12)
  })
})
