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
const headConfig = {
  type: 'mlp', hiddenSize: 32, dropout: 0, l2: 0.002, learningRate: 0.006,
  maxEpochs: 140, classWeighting: 'sqrt-balanced', seed: 53,
}

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
  const selected = scores.slice(0, Math.min(count, scores.length))
  return selected.reduce((sum, score) => sum + score, 0) / selected.length
}

async function imageFiles(directory) {
  return (await fs.readdir(directory)).filter((file) => /\.(png|jpe?g|webp)$/i.test(file)).sort().map((file) => path.join(directory, file))
}

function createHeadModel(inputSize) {
  const regularizer = tf.regularizers.l2({ l2: headConfig.l2 })
  const model = tf.sequential()
  model.add(tf.layers.dense({
    inputShape: [inputSize], units: headConfig.hiddenSize, activation: 'relu', kernelRegularizer: regularizer,
    kernelInitializer: tf.initializers.glorotUniform({ seed: headConfig.seed }),
  }))
  model.add(tf.layers.dense({
    units: classes.length, activation: 'softmax', kernelRegularizer: regularizer,
    kernelInitializer: tf.initializers.glorotUniform({ seed: headConfig.seed + 1 }),
  }))
  model.compile({ optimizer: tf.train.adam(headConfig.learningRate), loss: 'categoricalCrossentropy', metrics: ['accuracy'] })
  return model
}

function softmax(values) {
  const max = Math.max(...values)
  const exponentials = values.map((value) => Math.exp(value - max))
  const sum = exponentials.reduce((total, value) => total + value, 0) || 1
  return exponentials.map((value) => value / sum)
}

function classifyWithHead(vector, classifier) {
  const hidden = Array.from({ length: classifier.hiddenSize }, (_, hiddenIndex) => {
    let value = classifier.hiddenBias[hiddenIndex]
    for (let inputIndex = 0; inputIndex < classifier.inputSize; inputIndex += 1) {
      value += vector[inputIndex] * classifier.hiddenKernel[inputIndex * classifier.hiddenSize + hiddenIndex]
    }
    return Math.max(0, value)
  })
  const logits = Array.from({ length: classifier.classes.length }, (_, classIndex) => {
    let value = classifier.outputBias[classIndex]
    for (let hiddenIndex = 0; hiddenIndex < classifier.hiddenSize; hiddenIndex += 1) {
      value += hidden[hiddenIndex] * classifier.outputKernel[hiddenIndex * classifier.classes.length + classIndex]
    }
    return value
  })
  const probabilities = softmax(logits)
  return classifier.classes.map((label, index) => ({ label, score: probabilities[index] })).sort((left, right) => right.score - left.score)
}

function compactWeights(values) {
  return Array.from(values, (value) => Number(value.toFixed(7)))
}

function groupTrashSubtype(subtype) {
  if (subtype === 'single_litter') return 'scattered_litter'
  if (subtype === 'waste_pile') return 'illegal_dump'
  return subtype
}

async function main() {
  await tf.setBackend('cpu')
  await tf.ready()
  console.log('Loading MobileNetV2 alpha 0.5…')
  const featureModel = await mobilenet.load({ version: 2, alpha: 0.5 })
  const samples = {}
  const subtypeSamples = {}

  for (const label of classes) {
    if (label === 'trash') {
      samples.trash = []
      for (const subtype of trashSubtypes) {
        const files = await imageFiles(path.join(trainingRoot, 'trash', subtype))
        subtypeSamples[subtype] = []
        for (const file of files) {
          const embedding = await embeddingFor(featureModel, file)
          samples.trash.push(embedding)
          subtypeSamples[subtype].push(embedding)
        }
        console.log(`trash/${subtype}: ${files.length} samples`)
      }
      const genericFiles = await imageFiles(genericTrashRoot).catch(() => [])
      for (const file of genericFiles) samples.trash.push(await embeddingFor(featureModel, file))
      console.log(`trash/generic-real-world: ${genericFiles.length} samples`)
    } else {
      const files = await imageFiles(path.join(trainingRoot, label))
      samples[label] = []
      for (const file of files) samples[label].push(await embeddingFor(featureModel, file))
      console.log(`${label}: ${files.length} samples`)
    }
  }

  const validationRecords = []
  for (const group of ['trash', 'clean_scene', 'manhole', 'pothole', 'water_leak', 'broken_bench']) {
    const expected = group === 'clean_scene' ? 'other' : group
    for (const file of await imageFiles(path.join(root, 'data', 'ai-v2', 'validation', group))) {
      validationRecords.push({ file, expected, vector: await embeddingFor(featureModel, file) })
    }
  }

  const trainingVectors = []
  const trainingLabels = []
  for (const [classIndex, label] of classes.entries()) {
    for (const vector of samples[label]) {
      trainingVectors.push(normalize(vector))
      trainingLabels.push(classIndex)
    }
  }

  const trainX = tf.tensor2d(trainingVectors)
  const trainLabelTensor = tf.tensor1d(trainingLabels, 'int32')
  const trainY = tf.oneHot(trainLabelTensor, classes.length)
  const valX = tf.tensor2d(validationRecords.map((record) => record.vector))
  const valLabelTensor = tf.tensor1d(validationRecords.map((record) => classes.indexOf(record.expected)), 'int32')
  const valY = tf.oneHot(valLabelTensor, classes.length)
  const maxCount = Math.max(...classes.map((label) => samples[label].length))
  const classWeight = Object.fromEntries(classes.map((label, index) => [index, Math.sqrt(maxCount / samples[label].length)]))

  console.log('Training balanced MLP classifier head…')
  const headModel = createHeadModel(samples.trash[0].length)
  const history = await headModel.fit(trainX, trainY, {
    epochs: headConfig.maxEpochs, batchSize: 24, shuffle: false, validationData: [valX, valY], classWeight, verbose: 0,
  })

  const [hiddenKernel, hiddenBias, outputKernel, outputBias] = headModel.getWeights()
  const classifier = {
    type: headConfig.type, classes, inputSize: samples.trash[0].length, hiddenSize: headConfig.hiddenSize,
    hiddenKernel: compactWeights(await hiddenKernel.data()), hiddenBias: compactWeights(await hiddenBias.data()),
    outputKernel: compactWeights(await outputKernel.data()), outputBias: compactWeights(await outputBias.data()),
  }

  trainX.dispose(); trainLabelTensor.dispose(); trainY.dispose(); valX.dispose(); valLabelTensor.dispose(); valY.dispose()
  headModel.dispose()

  const evaluateVector = (vector, file, expected, expectedSubtype) => {
    const normalized = normalize(vector)
    const scores = classifyWithHead(normalized, classifier)
    const subtypeScores = trashSubtypes.map((subtype) => ({ subtype, score: topKAverage(normalized, subtypeSamples[subtype], 2) })).sort((a, b) => b.score - a.score)
    return {
      file: path.relative(root, file).replaceAll('\\', '/'), expected, predicted: scores[0].label,
      correct: scores[0].label === expected, expectedSubtype,
      predictedSubtype: scores[0].label === 'trash' ? subtypeScores[0].subtype : undefined, scores,
    }
  }
  const evaluateFile = async (file, expected, expectedSubtype) => evaluateVector(await embeddingFor(featureModel, file), file, expected, expectedSubtype)

  const validationResults = validationRecords.map((record) => evaluateVector(record.vector, record.file, record.expected))
  const validationAccuracy = validationResults.filter((result) => result.correct).length / validationResults.length
  const payload = {
    version: 3,
    architecture: 'MobileNetV2 alpha 0.5 embeddings + balanced MLP classifier head + top-k trash subtypes',
    embeddingSize: samples.trash[0].length, trainedAt: new Date().toISOString(),
    sampleCounts: Object.fromEntries(classes.map((label) => [label, samples[label].length])),
    training: { ...headConfig, completedEpochs: history.epoch.length, selectedUsing: 'validation-only model selection', validationAccuracy },
    classifier, samples, trashSubtypes: subtypeSamples,
  }
  await fs.writeFile(outputFile, `${JSON.stringify(payload)}\n`)

  const categoryRegression = []
  for (const expected of classes.filter((label) => label !== 'trash' && label !== 'other')) {
    categoryRegression.push(await evaluateFile(path.join(root, 'public', 'demo', `${expected}.webp`), expected))
  }
  const demoRegression = [await evaluateFile(path.join(root, 'public', 'demo', 'trash.webp'), 'trash'), ...categoryRegression]
  const expectedTrashSubtypes = {
    'blind-01.webp': 'single_litter', 'blind-02.webp': 'garbage_bags', 'blind-03.webp': 'overflowing_bin',
    'blind-05.webp': 'illegal_dump', 'blind-06.webp': 'illegal_dump', 'blind-07.webp': 'overflowing_bin',
    'blind-09.webp': 'illegal_dump', 'blind-10.webp': 'illegal_dump', 'blind-11.webp': 'garbage_bags',
    'blind-13.webp': 'scattered_litter', 'blind-14.webp': 'illegal_dump', 'blind-15.webp': 'single_litter',
    'blind2-01.webp': 'overflowing_bin', 'blind2-02.webp': 'overflowing_bin', 'blind2-03.webp': 'overflowing_bin',
    'blind2-04.webp': 'overflowing_bin', 'blind2-05.webp': 'garbage_bags', 'blind2-06.webp': 'garbage_bags',
    'blind2-07.webp': 'garbage_bags', 'blind2-08.webp': 'garbage_bags', 'blind2-09.webp': 'waste_pile',
    'blind2-10.webp': 'waste_pile', 'blind2-11.webp': 'illegal_dump', 'blind2-12.webp': 'illegal_dump',
    'blind2-13.webp': 'scattered_litter', 'blind2-14.webp': 'single_litter', 'blind3-04.webp': 'scattered_litter',
    'blind3-05.webp': 'scattered_litter', 'blind3-06.webp': 'scattered_litter', 'blind3-07.webp': 'scattered_litter',
    'blind3-09.webp': 'single_litter', 'blind3-10.webp': 'scattered_litter', 'blind3-11.webp': 'scattered_litter',
    'blind3-12.webp': 'scattered_litter', 'blind3-13.webp': 'single_litter',
  }
  const results = []
  for (const file of await imageFiles(path.join(root, 'data', 'ai-v2', 'final-test', 'trash'))) {
    results.push(await evaluateFile(file, 'trash', expectedTrashSubtypes[path.basename(file)]))
  }
  for (const file of await imageFiles(path.join(root, 'data', 'ai-v2', 'final-test', 'clean_scene'))) {
    results.push(await evaluateFile(file, 'other'))
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
    version: 3, architecture: payload.architecture,
    split: { training: Object.values(samples).reduce((sum, group) => sum + group.length, 0), validation: validationRecords.length, finalTest: results.length, baseRatio: '70/15/15', externalTrainingOnly: samples.trash.length - 60 },
    correct, total: results.length,
    combinedCorrect: correct + categoryRegression.filter((result) => result.correct).length,
    combinedTotal: results.length + categoryRegression.length,
    trashRecall: trashResults.filter((result) => result.correct).length / trashResults.length,
    cleanSpecificity: cleanResults.filter((result) => result.correct).length / cleanResults.length,
    trashSubtypeExactAccuracy: subtypeResults.filter((result) => result.predictedSubtype === result.expectedSubtype).length / subtypeResults.length,
    trashSubtypeAccuracy: subtypeResults.filter((result) => groupTrashSubtype(result.predictedSubtype) === groupTrashSubtype(result.expectedSubtype)).length / subtypeResults.length,
    validationAccuracy, benchmarkGroups,
    demoRegression: { correct: demoRegression.filter((result) => result.correct).length, total: demoRegression.length, results: demoRegression },
    categoryRegression: { correct: categoryRegression.filter((result) => result.correct).length, total: categoryRegression.length, results: categoryRegression },
    results,
  }
  await fs.writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Validation: ${validationResults.filter((result) => result.correct).length}/${validationResults.length}`)
  console.log(`Independent evaluation: ${correct}/${results.length}`)
  console.log(`Combined categories: ${report.combinedCorrect}/${report.combinedTotal}`)
  console.log(`Trash recall: ${Math.round(report.trashRecall * 100)}%`)
  console.log(`Clean specificity: ${Math.round(report.cleanSpecificity * 100)}%`)
  console.log(`Trash subtype accuracy: ${Math.round(report.trashSubtypeAccuracy * 100)}%`)
  console.log(`Five demo categories: ${report.demoRegression.correct}/${report.demoRegression.total}`)

  featureModel.model.dispose()
  if (validationAccuracy < 0.95 || correct < results.length || report.categoryRegression.correct < report.categoryRegression.total || report.trashSubtypeAccuracy < 0.9) process.exitCode = 2
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
