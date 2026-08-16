import fs from 'node:fs/promises'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import sharp from 'sharp'

const root = process.cwd()
const annotationUrl = 'https://raw.githubusercontent.com/pedropro/TACO/master/data/annotations.json'
const outputDirectory = path.join(root, 'data', 'ai-v2', 'train', 'trash_generic')
const metadataFile = path.join(root, 'data', 'ai-v2', 'taco-training-sample.json')
const sampleSize = 36

async function fetchRequired(url) {
  const response = await globalThis.fetch(url, { headers: { 'user-agent': 'QalaFix-AI-dataset-builder/2.0' } })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`)
  return response
}

await fs.mkdir(outputDirectory, { recursive: true })
const annotations = await (await fetchRequired(annotationUrl)).json()
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
  .filter((image) => image.sourceUrl && image.annotatedRatio >= 0.08 && image.annotatedRatio <= 0.75)
  .sort((left, right) => right.annotatedRatio - left.annotatedRatio)

const selected = Array.from({ length: sampleSize }, (_, index) => {
  const position = Math.floor((index / (sampleSize - 1)) * (candidates.length - 1))
  return candidates[position]
})

const imported = []
for (const image of selected) {
  const filename = `taco-${String(image.id).padStart(4, '0')}.jpg`
  const target = path.join(outputDirectory, filename)
  try {
    const source = Buffer.from(await (await fetchRequired(image.sourceUrl)).arrayBuffer())
    await sharp(source)
      .rotate()
      .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(target)
    imported.push({
      filename,
      tacoImageId: image.id,
      sourceUrl: image.sourceUrl,
      originalFile: image.file_name,
      annotatedRatio: Number(image.annotatedRatio.toFixed(4)),
    })
    console.log(`Imported ${filename}`)
  } catch (error) {
    console.warn(`Skipped TACO image ${image.id}: ${error.message}`)
  }
}

await fs.writeFile(metadataFile, `${JSON.stringify({
  source: 'TACO — Trash Annotations in Context',
  sourceRepository: 'https://github.com/pedropro/TACO',
  paper: 'https://arxiv.org/abs/2003.06975',
  importedAt: new Date().toISOString(),
  requested: sampleSize,
  imported: imported.length,
  images: imported,
}, null, 2)}\n`)

if (imported.length < 24) throw new Error(`Only ${imported.length} TACO images were imported`)
console.log(`Ready: ${imported.length} independent real-world litter images`)
