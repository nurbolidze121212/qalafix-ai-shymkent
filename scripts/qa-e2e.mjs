import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright-core'

const baseUrl = 'http://127.0.0.1:4174'
const outputDir = path.resolve('artifacts/qa')
const demoTrash = path.resolve('public/demo/trash.webp')
const chromeCandidates = [
  process.env.QALAFIX_CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)

async function firstExisting(paths) {
  for (const candidate of paths) {
    try {
      await access(candidate)
      return candidate
    } catch {
      // Try the next installed browser.
    }
  }
  throw new Error('Chrome or Edge was not found. Set QALAFIX_CHROME_PATH.')
}

async function waitForServer(url, timeout = 30_000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeout) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Preview did not start at ${url}`)
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  assert.ok(metrics.scrollWidth <= metrics.innerWidth + 1, `${label} overflows horizontally: ${JSON.stringify(metrics)}`)
}

async function assertVisible(locator, label) {
  await locator.waitFor({ state: 'visible', timeout: 30_000 })
  assert.equal(await locator.isVisible(), true, `${label} must be visible`)
}

await mkdir(outputDir, { recursive: true })
const browserExecutable = await firstExisting(chromeCandidates)
const viteEntry = path.resolve('node_modules/vite/bin/vite.js')
const preview = spawn(process.execPath, [viteEntry, 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe'],
})
let previewOutput = ''
preview.stdout.on('data', (chunk) => { previewOutput += String(chunk) })
preview.stderr.on('data', (chunk) => { previewOutput += String(chunk) })

let browser
try {
  await waitForServer(baseUrl)
  browser = await chromium.launch({ headless: true, executablePath: browserExecutable })

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    permissions: ['geolocation'],
    geolocation: { latitude: 42.315, longitude: 69.605, accuracy: 12 },
  })
  const page = await mobile.newPage()
  const runtimeErrors = []
  const sameOriginHttpErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('response', (response) => {
    if (response.url().startsWith(baseUrl) && response.status() >= 400) {
      sameOriginHttpErrors.push(`${response.status()} ${response.url()}`)
    }
  })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await assertVisible(page.getByRole('link', { name: 'Сообщить о проблеме' }).first(), 'main report action')
  await assertNoHorizontalOverflow(page, 'mobile home')
  await page.screenshot({ path: path.join(outputDir, 'mobile-home.png') })

  await page.goto(`${baseUrl}/report`, { waitUntil: 'networkidle' })
  for (const name of ['Переполненный контейнер', 'Открытый люк', 'Яма на дороге', 'Утечка воды', 'Сломанная скамейка']) {
    await assertVisible(page.getByRole('button', { name, exact: true }), `demo scenario: ${name}`)
  }
  await assertVisible(page.getByRole('button', { name: 'Камера', exact: true }).first(), 'camera action')
  await assertVisible(page.getByRole('button', { name: 'Галерея', exact: true }).first(), 'gallery action')
  await assertNoHorizontalOverflow(page, 'mobile report start')
  await page.screenshot({ path: path.join(outputDir, 'mobile-report.png') })

  await page.getByLabel('Выбрать фото из галереи').setInputFiles(demoTrash)
  await page.getByRole('button', { name: 'Начать AI-анализ' }).click()
  await assertVisible(page.getByText('Анализ на устройстве'), 'real local AI source')
  await assertVisible(page.getByText('Мусор', { exact: true }).first(), 'trash classification')
  const submittedTitle = (await page.locator('section h2').first().textContent())?.trim()
  assert.ok(submittedTitle, 'analyzed report title must be present')
  await assertNoHorizontalOverflow(page, 'mobile AI result')
  await page.screenshot({ path: path.join(outputDir, 'mobile-result.png') })

  await page.getByRole('button', { name: 'Определить моё местоположение' }).click()
  await page.getByText(/адрес найден|проверьте адрес вручную/i).waitFor({ state: 'visible', timeout: 30_000 })
  await page.getByRole('button', { name: 'Отправить обращение' }).click()
  await assertVisible(page.getByText('Обращение отправлено'), 'success state')

  await page.getByRole('button', { name: 'На карте' }).click()
  await page.waitForURL(/\/map\?category=/)
  await assertVisible(page.getByRole('button', { name: 'Фильтр: Мусор' }), 'trash map filter')
  await assertVisible(page.getByText(submittedTitle, { exact: true }).first(), 'submitted report on map')
  await assertNoHorizontalOverflow(page, 'mobile map')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(outputDir, 'mobile-map.png') })

  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Обращения', exact: true }).click()
  const newestStatus = page.locator('select[aria-label^="Статус обращения"]').first()
  await newestStatus.selectOption('in_progress')
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Обращения', exact: true }).click()
  assert.equal(await page.locator('select[aria-label^="Статус обращения"]').first().inputValue(), 'in_progress', 'operator status must persist after reload')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Экспорт CSV' }).click()
  const download = await downloadPromise
  assert.match(download.suggestedFilename(), /^qalafix-reports-\d{4}-\d{2}-\d{2}\.csv$/)
  await page.getByRole('button', { name: 'Аналитика', exact: true }).click()
  await assertVisible(page.getByText('Демонстрационная аналитика'), 'analytics tab')
  await page.getByRole('button', { name: 'Обращения', exact: true }).click()
  await assertNoHorizontalOverflow(page, 'mobile dashboard')
  await page.waitForTimeout(350)
  await page.screenshot({ path: path.join(outputDir, 'mobile-dashboard.png') })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) await navigator.serviceWorker.ready
  })
  await page.reload({ waitUntil: 'networkidle' })
  await mobile.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await assertVisible(page.getByRole('link', { name: 'Сообщить о проблеме' }).first(), 'offline home action')
  await mobile.setOffline(false)

  for (const width of [360, 375, 390, 414]) {
    await page.setViewportSize({ width, height: 844 })
    for (const route of ['/', '/report', '/map', '/dashboard']) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' })
      await assertNoHorizontalOverflow(page, `${width}px ${route}`)
      if (width === 360 && route === '/report') {
        await page.waitForTimeout(350)
        await page.screenshot({ path: path.join(outputDir, 'mobile-360-report.png') })
      }
    }
  }

  await page.goto(`${baseUrl}/missing-page`, { waitUntil: 'domcontentloaded' })
  await assertVisible(page.getByText('Страница не найдена'), '404 screen')

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const desktopPage = await desktop.newPage()
  for (const route of ['/', '/report', '/map', '/dashboard']) {
    await desktopPage.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' })
    await assertNoHorizontalOverflow(desktopPage, `desktop ${route}`)
  }
  await desktopPage.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' })
  await desktopPage.screenshot({ path: path.join(outputDir, 'desktop-dashboard.png') })
  await desktopPage.setViewportSize({ width: 1024, height: 768 })
  await assertNoHorizontalOverflow(desktopPage, '1024px dashboard')
  await desktop.close()

  assert.deepEqual(runtimeErrors, [], `browser runtime errors: ${runtimeErrors.join('; ')}`)
  assert.deepEqual(sameOriginHttpErrors, [], `same-origin HTTP errors: ${sameOriginHttpErrors.join('; ')}`)
  await mobile.close()
  console.log('QalaFix browser QA passed: local AI, report, location, map, dashboard, persistence, offline shell, responsive widths.')
} finally {
  await browser?.close().catch(() => undefined)
  preview.kill()
  if (preview.exitCode === null) await new Promise((resolve) => preview.once('exit', resolve)).catch(() => undefined)
  if (previewOutput && process.env.QALAFIX_QA_VERBOSE === '1') console.log(previewOutput)
}
