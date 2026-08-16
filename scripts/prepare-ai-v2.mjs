import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const sourceRoot = path.join(root, 'data', 'ai-source')
const targetRoot = path.join(root, 'data', 'ai-v2')

async function resetDirectory(directory) {
  await fs.rm(directory, { recursive: true, force: true })
  await fs.mkdir(directory, { recursive: true })
}

async function cropSheet(sourceName, destinationForCell) {
  const source = path.join(sourceRoot, sourceName)
  const metadata = await sharp(source).metadata()
  const cellWidth = Math.floor(metadata.width / 4)
  const cellHeight = Math.floor(metadata.height / 4)
  const inset = 5

  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const index = row * 4 + column
      const destination = destinationForCell({ row, column, index })
      if (!destination) continue
      await fs.mkdir(path.dirname(destination), { recursive: true })
      await sharp(source)
        .extract({
          left: column * cellWidth + inset,
          top: row * cellHeight + inset,
          width: cellWidth - inset * 2,
          height: cellHeight - inset * 2,
        })
        .resize(448, 448, { fit: 'cover' })
        .webp({ quality: 84 })
        .toFile(destination)
    }
  }
}

async function cropValidationSheet(sourceName) {
  const source = path.join(sourceRoot, sourceName)
  const metadata = await sharp(source).metadata()
  const cellWidth = Math.floor(metadata.width / 2)
  const cellHeight = Math.floor(metadata.height / 2)
  const groups = ['trash', 'trash', 'clean_scene', 'broken_bench']
  for (let index = 0; index < 4; index += 1) {
    const destination = path.join(targetRoot, 'validation', groups[index], `validation-extra-${index + 1}.webp`)
    await fs.mkdir(path.dirname(destination), { recursive: true })
    await sharp(source)
      .extract({ left: (index % 2) * cellWidth + 5, top: Math.floor(index / 2) * cellHeight + 5, width: cellWidth - 10, height: cellHeight - 10 })
      .resize(448, 448, { fit: 'cover' })
      .webp({ quality: 84 })
      .toFile(destination)
  }
}

async function main() {
  await resetDirectory(targetRoot)

  await cropSheet('trash-scattered-v2.png', ({ index }) => {
    const subtype = index < 4 ? 'single_litter' : 'scattered_litter'
    return path.join(targetRoot, 'train', 'trash', subtype, `generated-${String(index + 1).padStart(2, '0')}.webp`)
  })

  const rowSubtype = ['garbage_bags', 'overflowing_bin', 'waste_pile', 'illegal_dump']
  await cropSheet('trash-situations-v2.png', ({ row, column }) => (
    path.join(targetRoot, 'train', 'trash', rowSubtype[row], `generated-${row + 1}-${column + 1}.webp`)
  ))

  const previousTrashDirectory = path.join(root, 'data', 'ai-training', 'trash')
  const overflowDirectory = path.join(targetRoot, 'train', 'trash', 'overflowing_bin')
  for (const file of await fs.readdir(previousTrashDirectory)) {
    if (/\.webp$/i.test(file)) await fs.copyFile(path.join(previousTrashDirectory, file), path.join(overflowDirectory, `legacy-${file}`))
  }

  await cropSheet('trash-evaluation-v2.png', ({ column, index }) => {
    const group = column === 3 ? 'clean_scene' : 'trash'
    return path.join(targetRoot, 'holdout-pool', group, `blind-${String(index + 1).padStart(2, '0')}.webp`)
  })

  await cropSheet('trash-evaluation-v2b.png', ({ index }) => {
    const group = index < 14 ? 'trash' : 'clean_scene'
    return path.join(targetRoot, 'holdout-pool', group, `blind2-${String(index + 1).padStart(2, '0')}.webp`)
  })

  await cropSheet('trash-evaluation-v2c.png', ({ index }) => {
    const group = index < 13 ? 'trash' : 'clean_scene'
    return path.join(targetRoot, 'holdout-pool', group, `blind3-${String(index + 1).padStart(2, '0')}.webp`)
  })

  const developmentSubtypes = ['scattered_litter', 'scattered_litter', 'garbage_bags', 'garbage_bags', 'overflowing_bin', 'overflowing_bin', 'waste_pile', 'waste_pile', 'illegal_dump', 'illegal_dump', 'single_litter', 'single_litter']
  await cropSheet('trash-development-v2.png', ({ index }) => {
    if (index < 12) return path.join(targetRoot, 'train', 'trash', developmentSubtypes[index], `development-${String(index + 1).padStart(2, '0')}.webp`)
    const group = index === 15 ? 'clean_scene' : 'trash'
    return path.join(targetRoot, 'validation', group, `development-${String(index + 1).padStart(2, '0')}.webp`)
  })
  await cropValidationSheet('trash-validation-v2.png')

  for (const category of ['manhole', 'pothole', 'water_leak', 'broken_bench', 'other']) {
    const sourceDirectory = path.join(root, 'data', 'ai-training', category)
    const destinationDirectory = path.join(targetRoot, 'train', category)
    await fs.mkdir(destinationDirectory, { recursive: true })
    for (const file of await fs.readdir(sourceDirectory)) {
      if (/\.webp$/i.test(file)) await fs.copyFile(path.join(sourceDirectory, file), path.join(destinationDirectory, file))
    }
  }

  const benchmark = {
    overflowing_container: ['blind-03.webp', 'blind-07.webp', 'blind2-01.webp', 'blind2-02.webp', 'blind2-03.webp'],
    garbage_bags: ['blind-02.webp', 'blind-11.webp', 'blind2-05.webp', 'blind2-06.webp', 'blind2-07.webp'],
    waste_pile: ['blind-05.webp', 'blind-09.webp', 'blind2-09.webp', 'blind2-10.webp', 'blind2-11.webp'],
    scattered_litter: ['blind-13.webp', 'blind3-04.webp', 'blind3-05.webp', 'blind3-06.webp', 'blind3-07.webp'],
    difficult_positive: ['blind3-09.webp', 'blind3-10.webp', 'blind3-11.webp', 'blind3-12.webp', 'blind3-13.webp'],
    clean_scene: ['blind-04.webp', 'blind-08.webp', 'blind-12.webp', 'blind2-15.webp', 'blind2-16.webp'],
  }
  const selected = new Set(Object.values(benchmark).flat())
  for (const group of ['trash', 'clean_scene']) {
    const pool = path.join(targetRoot, 'holdout-pool', group)
    for (const file of await fs.readdir(pool)) {
      const partition = selected.has(file) ? 'final-test' : 'validation'
      const destination = path.join(targetRoot, partition, group, file)
      await fs.mkdir(path.dirname(destination), { recursive: true })
      await fs.copyFile(path.join(pool, file), destination)
    }
  }
  await fs.writeFile(path.join(targetRoot, 'final-test', 'benchmark-index.json'), `${JSON.stringify(benchmark, null, 2)}\n`)

  for (const category of ['manhole', 'pothole', 'water_leak', 'broken_bench']) {
    const destination = path.join(targetRoot, 'validation', category, `${category}.webp`)
    await fs.mkdir(path.dirname(destination), { recursive: true })
    await fs.copyFile(path.join(root, 'public', 'demo', `${category}.webp`), destination)
  }

  await fs.rm(path.join(targetRoot, 'holdout-pool'), { recursive: true, force: true })

  const manifest = {
    version: 2,
    license: 'project-owned synthetic images generated for QalaFix AI',
    privacy: 'prompts exclude people, faces, readable number plates, brands and watermarks',
    split: {
      training: { count: 140, percent: 70 },
      validation: { count: 30, percent: 15 },
      finalTest: { count: 30, percent: 15 },
    },
    trainingClasses: { trash: 60, manhole: 16, pothole: 16, water_leak: 16, broken_bench: 16, other: 16 },
    finalTestGroups: Object.fromEntries(Object.entries(benchmark).map(([group, files]) => [group, files.length])),
    externalDatasetPolicy: 'Metadata and licenses were audited; no third-party photos are included in the production model.',
  }
  await fs.writeFile(path.join(targetRoot, 'dataset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

  console.log('QalaFix AI 2.0 dataset prepared')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
