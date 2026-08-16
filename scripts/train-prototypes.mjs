import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import * as tf from '@tensorflow/tfjs'
import * as mobilenet from '@tensorflow-models/mobilenet'
import sharp from 'sharp'

const root = process.cwd()
const trainingRoot = path.join(root, 'data', 'ai-v2', 'train')
const genericTrashRoot = path.join(trainingRoot, 'trash_generic')
const outputFile = path.join(root, 'public', 'ai', 'prototypes.json')
const reportFile = path.join(root, 'data', 'ai-evaluation.json')
const classes = ['trash', 'manhole', 'pothole', 'water_leak', 'broken_bench', 'other']
const trashSubtypes = ['scattered_litter', 'garbage_bags', 'overflowing_bin', 'waste_pile', 'illegal_dump', 'single_litter']

async function imageTensor(file) {
  const { data, info } = await sharp(file).removeAlpha().resize(224, 224, { fit: 'cover' }).raw().toBuffer({ resolveWithObject: true })
  return tf.tensor3d(new Uint8Array(data), [info.height, info.width, info.channels], 'int32')
}

async function embeddingFor(model, file) {
  const image = await imageTensor(file)
  const embeddingTensor = model.infer(image, true)
  const embedding = normalize(Array.from(await embeddingTensor.data())).map((value) => Number(value.toFixed(5)))
  image.dispose()
  embeddingTensor.dispose()
  return embedding
}

function normalize(vector) {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
  return vector.map((value) => value / norm)
}

function cosine(left, right) {
  return left.reduce((sum, value, index) => sum + value * right[index], 0)
}

function topKAverage(vector, samples, count = 3) {
  const scores = samples.map((sample) => cosine(vector, sample)).sort((a, b) => b - a)
  return scores.slice(0, Math.min(count, scores.length)).reduce((sum, score) => sum + score, 0) / Math.min(count, scores.length)
}

async function imageFiles(directory) {
  return (await fs.readdir(directory)).filter((file) => /\.(png|jpe?g|webp)$/i.test(file)).sort().map((file) => path.join(directory, file))
}

async function main() {
  console.log('Loading MobileNet v2 alpha 0.5…')
  const model = await mobilenet.load({ version: 2, alpha: 0.5 })
  const samples = {}
  const subtypeSamples = {}

  for (const label of classes) {
    if (label === 'trash') {
      samples.trash = []
      for (const subtype of trashSubtypes) {
        const files = await imageFiles(path.join(trainingRoot, 'trash', subtype))
        subtypeSamples[subtype] = []
        for (const file of files) {
          const embedding = await embeddingFor(model, file)
          samples.trash.push(embedding)
          subtypeSamples[subtype].push(embedding)
        }
        console.log(`trash/${subtype}: ${files.length} samples`)
      }
      const genericFiles = await imageFiles(genericTrashRoot).catch(() => [])
      for (const file of genericFiles) samples.trash.push(await embeddingFor(model, file))
      console.log(`trash/generic-real-world: ${genericFiles.length} samples`)
    } else {
      const files = await imageFiles(path.join(trainingRoot, label))
      samples[label] = []
      for (const file of files) samples[label].push(await embeddingFor(model, file))
      console.log(`${label}: ${files.length} samples`)
    }
  }

  const payload = {
    version: 2,
    architecture: 'MobileNetV2 alpha 0.5 embeddings + top-k nearest samples',
    embeddingSize: samples.trash[0].length,
    trainedAt: new Date().toISOString(),
    sampleCounts: Object.fromEntries(classes.map((label) => [label, samples[label].length])),
    samples,
    trashSubtypes: subtypeSamples,
  }
  await fs.writeFile(outputFile, `${JSON.stringify(payload)}\n`)

  const evaluate = async (file, expected, expectedSubtype) => {
    const vector = await embeddingFor(model, file)
    const scores = classes.map((label) => ({ label, score: topKAverage(vector, samples[label]) })).sort((a, b) => b.score - a.score)
    const subtypeScores = trashSubtypes.map((subtype) => ({ subtype, score: topKAverage(vector, subtypeSamples[subtype], 2) })).sort((a, b) => b.score - a.score)
    return {
      file: path.relative(root, file).replaceAll('\\', '/'),
      expected,
      predicted: scores[0].label,
      correct: scores[0].label === expected,
      expectedSubtype,
      predictedSubtype: scores[0].label === 'trash' ? subtypeScores[0].subtype : undefined,
      scores,
    }
  }

  const categoryRegression = []
  for (const expected of classes.filter((label) => label !== 'trash' && label !== 'other')) {
    categoryRegression.push(await evaluate(path.join(root, 'public', 'demo', `${expected}.webp`), expected))
  }
  const expectedTrashSubtypes = {
    'blind-01.webp': 'single_litter',
    'blind-02.webp': 'garbage_bags',
    'blind-03.webp': 'overflowing_bin',
    'blind-05.webp': 'illegal_dump',
    'blind-06.webp': 'illegal_dump',
    'blind-07.webp': 'overflowing_bin',
    'blind-09.webp': 'illegal_dump',
    'blind-10.webp': 'illegal_dump',
    'blind-11.webp': 'garbage_bags',
    'blind-13.webp': 'scattered_litter',
    'blind-14.webp': 'illegal_dump',
    'blind-15.webp': 'single_litter',
    'blind2-01.webp': 'overflowing_bin',
    'blind2-02.webp': 'overflowing_bin',
    'blind2-03.webp': 'overflowing_bin',
    'blind2-04.webp': 'overflowing_bin',
    'blind2-05.webp': 'garbage_bags',
    'blind2-06.webp': 'garbage_bags',
    'blind2-07.webp': 'garbage_bags',
    'blind2-08.webp': 'garbage_bags',
    'blind2-09.webp': 'waste_pile',
    'blind2-10.webp': 'waste_pile',
    'blind2-11.webp': 'illegal_dump',
    'blind2-12.webp': 'illegal_dump',
    'blind2-13.webp': 'scattered_litter',
    'blind2-14.webp': 'single_litter',
    'blind3-04.webp': 'scattered_litter',
    'blind3-05.webp': 'scattered_litter',
    'blind3-06.webp': 'scattered_litter',
    'blind3-07.webp': 'scattered_litter',
    'blind3-09.webp': 'single_litter',
    'blind3-10.webp': 'scattered_litter',
    'blind3-11.webp': 'scattered_litter',
    'blind3-12.webp': 'scattered_litter',
    'blind3-13.webp': 'single_litter',
  }
  const results = []
  for (const file of await imageFiles(path.join(root, 'data', 'ai-v2', 'final-test', 'trash'))) {
    results.push(await evaluate(file, 'trash', expectedTrashSubtypes[path.basename(file)]))
  }
  for (const file of await imageFiles(path.join(root, 'data', 'ai-v2', 'final-test', 'clean_scene'))) {
    results.push(await evaluate(file, 'other'))
  }

  const validationResults = []
  for (const group of ['trash', 'clean_scene', 'manhole', 'pothole', 'water_leak', 'broken_bench']) {
    const expected = group === 'clean_scene' ? 'other' : group === 'trash' ? 'trash' : group
    for (const file of await imageFiles(path.join(root, 'data', 'ai-v2', 'validation', group))) validationResults.push(await evaluate(file, expected))
  }

  const trashResults = results.filter((result) => result.expected === 'trash')
  const cleanResults = results.filter((result) => result.expected === 'other')
  const subtypeResults = trashResults.filter((result) => result.expectedSubtype)
  const correct = results.filter((result) => result.correct).length
  const benchmark = JSON.parse(await fs.readFile(path.join(root, 'data', 'ai-v2', 'final-test', 'benchmark-index.json'), 'utf8'))
  const benchmarkGroups = Object.fromEntries(Object.entries(benchmark).map(([group, files]) => {
    const names = new Set(files)
    const groupResults = results.filter((result) => names.has(path.basename(result.file)))
    return [group, { correct: groupResults.filter((result) => result.correct).length, total: groupResults.length }]
  }))
  const report = {
    version: 2,
    split: { training: Object.values(samples).reduce((sum, group) => sum + group.length, 0), validation: 30, finalTest: 30, baseRatio: '70/15/15', externalTrainingOnly: samples.trash.length - 60 },
    correct,
    total: results.length,
    trashRecall: trashResults.filter((result) => result.correct).length / trashResults.length,
    cleanSpecificity: cleanResults.filter((result) => result.correct).length / cleanResults.length,
    trashSubtypeAccuracy: subtypeResults.filter((result) => result.predictedSubtype === result.expectedSubtype).length / subtypeResults.length,
    validationAccuracy: validationResults.filter((result) => result.correct).length / validationResults.length,
    benchmarkGroups,
    categoryRegression: {
      correct: categoryRegression.filter((result) => result.correct).length,
      total: categoryRegression.length,
      results: categoryRegression,
    },
    results,
  }
  await fs.writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Independent evaluation: ${correct}/${results.length}`)
  console.log(`Trash recall: ${Math.round(report.trashRecall * 100)}%`)
  console.log(`Clean specificity: ${Math.round(report.cleanSpecificity * 100)}%`)
  console.log(`Trash subtype accuracy: ${Math.round(report.trashSubtypeAccuracy * 100)}%`)
  console.log(`Validation accuracy: ${Math.round(report.validationAccuracy * 100)}%`)
  console.log(`Other city categories: ${report.categoryRegression.correct}/${report.categoryRegression.total}`)
  if (report.trashRecall < 0.85) process.exitCode = 2
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
