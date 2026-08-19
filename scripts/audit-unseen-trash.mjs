import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import * as tf from '@tensorflow/tfjs'
import * as mobilenet from '@tensorflow-models/mobilenet'
import sharp from 'sharp'

const root = process.cwd()
const annotationsFile = path.join(root, 'data', 'external', 'TACO', 'data', 'annotations.json')
const trainingMetadataFile = path.join(root, 'data', 'ai-v2', 'taco-training-sample.json')
const modelFile = path.join(root, 'public', 'ai', 'prototypes.json')
const outputFile = path.join(root, 'data', 'ai-unseen-audit.json')
const cacheDirectory = path.join(root, 'tmp', 'ai-unseen-audit')
const requestedSamples = 20

function normalize(vector) {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
  return vector.map((value) => value / norm)
}

function softmax(values) {
  const max = Math.max(...values)
  const exponentials = values.map((value) => Math.exp(value - max))
  const sum = exponentials.reduce((total, value) => total + value, 0) || 1
  return exponentials.map((value) => value / sum)
}

function classify(vector, head) {
  const normalized = normalize(vector)
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
  return head.classes
    .map((label, index) => ({ label, score: probabilities[index] }))
    .sort((left, right) => right.score - left.score)
}

async function imageTensor(file) {
  const { data, info } = await sharp(file).removeAlpha().resize(224, 224, { fit: 'cover' }).raw().toBuffer({ resolveWithObject: true })
  return tf.tensor3d(new Uint8Array(data), [info.height, info.width, info.channels], 'int32')
}

async function download(url, target) {
  try {
    await fs.access(target)
    return
  } catch {
    // Cache miss is expected on the first independent audit.
  }
  const response = await globalThis.fetch(url, { headers: { 'user-agent': 'QalaFix-AI-independent-audit/1.0' } })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  const source = Buffer.from(await response.arrayBuffer())
  await sharp(source).rotate().resize(640, 640, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(target)
}

await tf.setBackend('cpu')
await tf.ready()
await fs.mkdir(cacheDirectory, { recursive: true })

const [annotations, trainingMetadata, artifact] = await Promise.all([
  fs.readFile(annotationsFile, 'utf8').then(JSON.parse),
  fs.readFile(trainingMetadataFile, 'utf8').then(JSON.parse),
  fs.readFile(modelFile, 'utf8').then(JSON.parse),
])
if (artifact.version !== 3 || artifact.classifier?.type !== 'mlp') throw new Error('Expected frozen model artifact v3 with an MLP head')

const usedIds = new Set(trainingMetadata.images.map((image) => image.tacoImageId))
const annotatedArea = new Map()
for (const annotation of annotations.annotations) {
  annotatedArea.set(annotation.image_id, (annotatedArea.get(annotation.image_id) ?? 0) + annotation.area)
}
const candidates = annotations.images
  .map((image) => ({
    ...image,
    sourceUrl: image.flickr_640_url || image.flickr_url,
    annotatedRatio: (annotatedArea.get(image.id) ?? 0) / (image.width * image.height),
  }))
  .filter((image) => image.sourceUrl && !usedIds.has(image.id) && image.annotatedRatio >= 0.10 && image.annotatedRatio <= 0.75)
  .sort((left, right) => left.id - right.id)

const selected = Array.from({ length: requestedSamples }, (_, index) => {
  const position = Math.floor(((index + 0.5) / requestedSamples) * candidates.length)
  return candidates[Math.min(position, candidates.length - 1)]
})
const featureModel = await mobilenet.load({ version: 2, alpha: 0.5 })
const results = []

for (const image of selected) {
  const target = path.join(cacheDirectory, `taco-audit-${String(image.id).padStart(4, '0')}.jpg`)
  try {
    await download(image.sourceUrl, target)
    const tensor = await imageTensor(target)
    const embeddingTensor = featureModel.infer(tensor, true)
    const scores = classify(Array.from(await embeddingTensor.data()), artifact.classifier)
    tensor.dispose()
    embeddingTensor.dispose()
    const margin = Math.max(0, scores[0].score - scores[1].score)
    const confidence = Math.round(Math.max(45, Math.min(99, 40 + scores[0].score * 45 + margin * 35)))
    const needsReview = scores[0].label === 'other'
      || (scores[0].label === 'trash' ? scores[0].score < 0.45 || margin < 0.08 : scores[0].score < 0.52 || margin < 0.12)
    results.push({
      tacoImageId: image.id,
      sourceUrl: image.sourceUrl,
      annotatedRatio: Number(image.annotatedRatio.toFixed(4)),
      expected: 'trash',
      predicted: scores[0].label,
      correct: scores[0].label === 'trash',
      confidence,
      needsReview,
      scores: scores.slice(0, 3).map(({ label, score }) => ({ label, score: Number(score.toFixed(6)) })),
    })
    console.log(`${image.id}: ${scores[0].label} ${confidence}%${needsReview ? ' · review' : ''}`)
  } catch (error) {
    console.warn(`${image.id}: skipped · ${error.message}`)
  }
}

const correct = results.filter((result) => result.correct).length
const recall = results.length ? correct / results.length : 0
const confidentCorrect = results.filter((result) => result.correct && !result.needsReview).length
const report = {
  version: 1,
  purpose: 'Frozen-model audit on unseen real-world TACO images; this command does not train or alter the model.',
  source: 'TACO — Trash Annotations in Context',
  sourceRepository: 'https://github.com/pedropro/TACO',
  modelVersion: artifact.version,
  modelTrainedAt: artifact.trainedAt,
  auditedAt: new Date().toISOString(),
  selection: 'Deterministic sample, disjoint from the 36 TACO training images, annotated trash area 10–75%.',
  requested: requestedSamples,
  evaluated: results.length,
  correct,
  recall,
  confidentCorrect,
  results,
}
await fs.writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`)
console.log(`Unseen TACO audit: ${correct}/${results.length} (${Math.round(recall * 100)}% recall), ${confidentCorrect} confident correct`)
if (results.length < 15) throw new Error(`Only ${results.length} unseen audit images were available`)
if (recall < 0.8) throw new Error(`Unseen trash recall ${Math.round(recall * 100)}% is below the 80% release gate`)
