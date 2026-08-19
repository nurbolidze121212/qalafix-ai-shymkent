import type { ModelClass } from '../types/report'

export type LocalClassifierHead = {
  type: 'mlp'
  classes: ModelClass[]
  inputSize: number
  hiddenSize: number
  hiddenKernel: number[]
  hiddenBias: number[]
  outputKernel: number[]
  outputBias: number[]
}

export type ClassScore = { modelClass: ModelClass; score: number }

function softmax(values: number[]) {
  const max = Math.max(...values)
  const exponentials = values.map((value) => Math.exp(value - max))
  const sum = exponentials.reduce((total, value) => total + value, 0) || 1
  return exponentials.map((value) => value / sum)
}

export function validateClassifierHead(head: LocalClassifierHead, embeddingSize: number) {
  return head.type === 'mlp'
    && head.inputSize === embeddingSize
    && head.classes.length === head.outputBias.length
    && head.hiddenKernel.length === head.inputSize * head.hiddenSize
    && head.hiddenBias.length === head.hiddenSize
    && head.outputKernel.length === head.hiddenSize * head.classes.length
    && [...head.hiddenKernel, ...head.hiddenBias, ...head.outputKernel, ...head.outputBias].every(Number.isFinite)
}

export function scoreEmbeddingWithHead(embedding: number[], head: LocalClassifierHead): ClassScore[] {
  if (embedding.length !== head.inputSize || !validateClassifierHead(head, embedding.length)) {
    throw new Error('Некорректная конфигурация локальной AI-модели')
  }
  const norm = Math.sqrt(embedding.reduce((sum, value) => sum + value * value, 0)) || 1
  const normalized = embedding.map((value) => value / norm)
  const hidden = Array.from({ length: head.hiddenSize }, (_, hiddenIndex) => {
    let value = head.hiddenBias[hiddenIndex]
    for (let inputIndex = 0; inputIndex < head.inputSize; inputIndex += 1) {
      value += normalized[inputIndex] * head.hiddenKernel[inputIndex * head.hiddenSize + hiddenIndex]
    }
    return Math.max(0, value)
  })
  const logits = Array.from({ length: head.classes.length }, (_, classIndex) => {
    let value = head.outputBias[classIndex]
    for (let hiddenIndex = 0; hiddenIndex < head.hiddenSize; hiddenIndex += 1) {
      value += hidden[hiddenIndex] * head.outputKernel[hiddenIndex * head.classes.length + classIndex]
    }
    return value
  })
  const probabilities = softmax(logits)
  return head.classes.map((modelClass, index) => ({ modelClass, score: probabilities[index] })).sort((left, right) => right.score - left.score)
}

export function applyLearnedCorrections(scores: ClassScore[], learnedSimilarities: Partial<Record<ModelClass, number>>) {
  const adjusted = scores.map(({ modelClass, score }) => {
    const learnedSimilarity = learnedSimilarities[modelClass] ?? 0
    return {
      modelClass,
      score: learnedSimilarity >= 0.72
        ? Math.max(score, Math.min(0.98, 0.5 + (learnedSimilarity - 0.72) * 1.7))
        : score,
    }
  })
  const sum = adjusted.reduce((total, item) => total + item.score, 0) || 1
  return adjusted.map((item) => ({ ...item, score: item.score / sum })).sort((left, right) => right.score - left.score)
}
