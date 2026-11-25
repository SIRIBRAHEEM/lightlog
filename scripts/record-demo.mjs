// Records the LightLog demo walkthrough with a visible cursor + click
// ripples, paced to the narration segments. Run after `npm run build`:
//   node scripts/record-demo.mjs
// Output: video/walkthrough/*.webm + video/scene-times.json
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const CHROME = '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUTDIR = join(ROOT, 'video', 'walkthrough')
await mkdir(OUTDIR, { recursive: true })

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (path === '/') path = '/index.html'
  if (path.endsWith('favicon.ico')) { res.writeHead(204); res.end(); return }
  try {
    const body = await readFile(join(DIST, normalize(path)))
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end('not found')
  }
})
await new Promise((r) => server.listen(0, r))
const port = server.address().port
const base = `http://127.0.0.1:${port}/`

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const t0 = Date.now()
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: OUTDIR, size: { width: 1280, height: 800 } },
})
const page = await context.newPage()

// Visible cursor + click ripple overlay, injected before any page script.
await page.addInitScript(() => {
  const install = () => {
    if (document.getElementById('demo-cursor')) return
    const cursor = document.createElement('div')
    cursor.id = 'demo-cursor'
    cursor.style.cssText =
      'position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;' +
      'pointer-events:none;transform:translate(-100px,-100px);' +
      'filter:drop-shadow(0 1px 2px rgba(0,0,0,0.55));'
    cursor.innerHTML =
      '<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M6 3 L22 14 L14.5 15.5 L18 23 L14.8 24.5 L11.3 16.8 L6 21 Z" ' +
      'fill="#ffffff" stroke="#14152a" stroke-width="1.6" stroke-linejoin="round"/></svg>'
    document.documentElement.appendChild(cursor)
    let x = -100
    let y = -100
    const place = () => {
      cursor.style.transform = `translate(${x - 5}px, ${y - 3}px)`
    }
    window.addEventListener(
      'mousemove',
      (e) => {
        x = e.clientX
        y = e.clientY
        place()
      },
      true,
    )
    window.addEventListener(
      'mousedown',
      (e) => {
        const ripple = document.createElement('div')
        ripple.style.cssText =
          `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;` +
          'width:44px;height:44px;border-radius:50%;z-index:2147483646;' +
          'pointer-events:none;border:3px solid #ffc24b;opacity:0.95;' +
          'transform:scale(0.35);transition:transform 480ms ease-out, opacity 480ms ease-out;'
        document.documentElement.appendChild(ripple)
        requestAnimationFrame(() => {
          ripple.style.transform = 'scale(1.5)'
          ripple.style.opacity = '0'
        })
        setTimeout(() => ripple.remove(), 520)
      },
      true,
    )
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install)
  } else {
    install()
  }
})

const consoleErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => consoleErrors.push(String(err)))

const elapsed = () => (Date.now() - t0) / 1000
const sceneTimes = {}
let sceneStart = 0
function markScene(name) {
  sceneTimes[name] = Number(elapsed().toFixed(2))
  sceneStart = Date.now()
  console.log('scene', name, 'at', sceneTimes[name], 's')
}
async function holdUntil(seconds) {
  const target = sceneStart + seconds * 1000
  const remain = target - Date.now()
  if (remain > 0) await page.waitForTimeout(remain)
}

async function moveToBox(box, steps = 28) {
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps })
}
async function scrollIntoView(locator) {
  for (let i = 0; i < 12; i++) {
    const box = await locator.boundingBox()
    if (!box) throw new Error('no bounding box')
    if (box.y > 60 && box.y + box.height < 760) return box
    const dy = box.y > 400 ? 320 : -320
    await page.mouse.wheel(0, dy)
    await page.waitForTimeout(220)
  }
  return locator.boundingBox()
}
async function clickLoc(locator) {
  const box = await scrollIntoView(locator)
  await moveToBox(box)
  await page.waitForTimeout(280)
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(450)
}
async function smoothWheel(dy, steps = 6) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy / steps)
    await page.waitForTimeout(110)
  }
}

const btn = (label) => page.locator(`button:has-text("${label}")`).first()
const tabBtn = (label) => page.locator(`.tabs button:has-text("${label}")`)

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
sceneTimes.appReady = Number(elapsed().toFixed(2))
console.log('app ready at', sceneTimes.appReady, 's')

// ---------- Scene 1: intro, welcome screen ----------
markScene('s1')
await page.mouse.move(640, 400, { steps: 10 })
await page.waitForTimeout(800)
await moveToBox(await page.locator('.welcome h2').boundingBox())
await page.waitForTimeout(1500)
await moveToBox(await btn('Start fresh').boundingBox())
await page.waitForTimeout(1200)
await clickLoc(btn('Try it with a sample week'))
await holdUntil(13.5)

// ---------- Scene 2: Today screen + toggle ----------
markScene('s2')
await moveToBox(await page.locator('.hero').boundingBox())
await page.waitForTimeout(1200)
await moveToBox(await page.locator('.tiles').boundingBox())
await page.waitForTimeout(1000)
await smoothWheel(300)
await moveToBox(await page.locator('.timeline').boundingBox())
await page.waitForTimeout(800)
await smoothWheel(-300)
await clickLoc(btn('Light just came on'))
await page.waitForTimeout(500)
await smoothWheel(300)
await moveToBox(await page.locator('.timeline li').first().boundingBox())
await holdUntil(13.5)

// ---------- Scene 2b: missed a change card ----------
markScene('s2b')
await smoothWheel(340)
await moveToBox(await page.locator('#past-time').boundingBox())
await page.waitForTimeout(800)
await moveToBox(await btn('Add it').boundingBox())
await holdUntil(6)

// ---------- Scene 3: Patterns ----------
markScene('s3')
await smoothWheel(-700)
await clickLoc(tabBtn('Patterns'))
await page.waitForTimeout(600)
await moveToBox(await page.locator('.heat').boundingBox())
await page.waitForTimeout(1500)
// Hover the tall 9pm bar (index 21 of 24)
const bars = page.locator('.heat .bar')
const bar21 = await bars.nth(21).boundingBox()
if (bar21) await moveToBox(bar21)
await page.waitForTimeout(2000)
await smoothWheel(320)
await moveToBox(await page.locator('.best-hours').boundingBox())
await page.waitForTimeout(1500)
await smoothWheel(340)
await moveToBox(await page.locator('.week').boundingBox())
await holdUntil(22)

// ---------- Scene 4: Charge planner ----------
markScene('s4')
await smoothWheel(-700)
await clickLoc(tabBtn('Charge planner'))
await page.waitForTimeout(600)
await moveToBox(await page.locator('.devices').boundingBox())
await page.waitForTimeout(1500)
await moveToBox(await page.locator('#battery').boundingBox())
await holdUntil(12.5)

// ---------- Scene 4b: laptop at 20 percent ----------
markScene('s4b')
await clickLoc(page.locator('.device:has-text("Laptop")'))
await page.waitForTimeout(400)
// Drag the battery slider from 35 to about 20 percent
const slider = page.locator('#battery')
const sbox = await slider.boundingBox()
const startX = sbox.x + (sbox.width * 35) / 100
const endX = sbox.x + (sbox.width * 20) / 100
const cy = sbox.y + sbox.height / 2
await page.mouse.move(startX, cy, { steps: 20 })
await page.mouse.down()
await page.mouse.move(endX, cy, { steps: 18 })
await page.mouse.up()
await page.waitForTimeout(600)
let pctText = await page.locator('.pct').textContent()
let pctVal = parseInt(pctText, 10)
for (let i = 0; i < 10 && pctVal !== 20; i++) {
  await page.keyboard.press(pctVal < 20 ? 'ArrowRight' : 'ArrowLeft')
  await page.waitForTimeout(150)
  pctText = await page.locator('.pct').textContent()
  pctVal = parseInt(pctText, 10)
}
console.log('battery pct after drag+adjust:', pctText)
await moveToBox(await page.locator('.result').boundingBox())
await holdUntil(13)

// ---------- Scene 5: closing on Today ----------
markScene('s5')
await clickLoc(tabBtn('Today'))
await page.waitForTimeout(600)
await moveToBox(await page.locator('.logo').boundingBox())
await holdUntil(8)

sceneTimes.end = Number(elapsed().toFixed(2))
console.log('end at', sceneTimes.end, 's')

const video = page.video()
await context.close()
const videoPath = await video.path()
await browser.close()
server.close()

await writeFile(join(ROOT, 'video', 'scene-times.json'), JSON.stringify(sceneTimes, null, 2))
console.log('video:', videoPath)
console.log(JSON.stringify(sceneTimes, null, 2))
if (consoleErrors.length > 0) {
  console.error('CONSOLE ERRORS:', consoleErrors)
  process.exit(1)
}
console.log('done, zero console errors')
