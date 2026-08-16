import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const output = path.resolve(root, 'dist')
if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== 'dist') {
  throw new Error(`Refusing to clean unexpected directory: ${output}`)
}
await fs.rm(output, { recursive: true, force: true })
