// End-to-end checks for LightLog. Serves dist/ locally, drives every
// screen with Playwright, fails on any console error, and saves the
// 6 documentation screenshots into docs/.
// Run after `npm run build`:  node scripts/e2e.mjs
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const CHROME = '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const DOCS = join(ROOT, 'docs')
await mkdir(DOCS, { recursive: true })

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
}

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (path === '/') path = '/index.html'
  try {
    const body = await readFile(join(DIST, normalize(path)))
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end('not found')
  }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}/`

let passed = 0
let failed = 0
function check(name, ok) {
  if (ok) { passed++; console.log(`ok - ${name}`) }
  else { failed++; console.log(`FAIL - ${name}`) }
}

const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } })
const errors = []
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', (err) => errors.push(String(err)))

await page.goto(base, { waitUntil: 'networkidle' })
check('page loads with LightLog heading', await page.getByRole('heading', { name: 'LightLog', exact: true }).isVisible())
check('welcome screen shows sample week button', await page.getByRole('button', { name: 'Try it with a sample week' }).isVisible())
await page.screenshot({ path: join(DOCS, '1-welcome.png') })

await page.getByRole('button', { name: 'Try it with a sample week' }).click()
await page.waitForTimeout(300)
check('today tab shows light status', await page.locator('text=/Light is on|No light|No log yet/').first().isVisible())
check('today stats tiles render', await page.locator('text=Light today so far').isVisible())
check('timeline card renders', await page.getByRole('heading', { name: "Today's timeline" }).isVisible())
await page.screenshot({ path: join(DOCS, '2-today.png') })

const toggle = page.getByRole('button', { name: /Light just (came on|went off)/ })
check('toggle button present', await toggle.isVisible())
await toggle.click()
await page.waitForTimeout(300)
check('timeline gains an entry after toggle', (await page.locator('text=/Light came on|Light went off/').count()) > 0)
check('undo button appears after logging', await page.getByRole('button', { name: 'Undo last log' }).isVisible())

await page.getByRole('button', { name: 'Patterns' }).click()
await page.waitForTimeout(300)
check('patterns chart renders', await page.getByRole('img', { name: 'Hourly light pattern chart' }).isVisible())
check('week chart heading renders', await page.getByRole('heading', { name: 'Light per day, last 7 days' }).isVisible())
await page.screenshot({ path: join(DOCS, '3-patterns.png') })

await page.getByRole('button', { name: 'Charge planner' }).click()
await page.waitForTimeout(300)
check('charge planner renders', await page.getByRole('heading', { name: 'Charge planner' }).isVisible())
check('charge result shows time to full', await page.locator('text=Time to full charge').isVisible())
await page.screenshot({ path: join(DOCS, '4-charge.png') })

await page.getByRole('button', { name: /Laptop/ }).click()
await page.waitForTimeout(200)
check('laptop device selectable', await page.getByRole('button', { name: /Laptop/ }).getAttribute('aria-pressed') === 'true')
await page.locator('#battery').fill('20')
await page.waitForTimeout(200)
check('battery slider updates percent', await page.locator('text=20%').first().isVisible())
await page.screenshot({ path: join(DOCS, '5-charge-laptop.png') })

await page.reload({ waitUntil: 'networkidle' })
check('data persists after reload (no welcome screen)', await page.getByRole('button', { name: 'Today' }).isVisible())

const mobile = await browser.newPage({ viewport: { width: 390, height: 780 } })
mobile.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
mobile.on('pageerror', (err) => errors.push(String(err)))
await mobile.goto(base, { waitUntil: 'networkidle' })
await mobile.getByRole('button', { name: 'Try it with a sample week' }).click()
await mobile.waitForTimeout(300)
check('mobile today screen renders', await mobile.locator('text=Light today so far').isVisible())
await mobile.screenshot({ path: join(DOCS, '6-mobile-today.png') })

check('zero console errors', errors.length === 0)
if (errors.length) console.log('console errors:', errors)

await browser.close()
server.close()
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
