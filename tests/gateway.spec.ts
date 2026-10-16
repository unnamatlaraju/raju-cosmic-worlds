import { expect, test } from '@playwright/test'

const welcome = "Welcome to Raju's Universe."
const launch = /Enter the spacecraft/
const atlas = 'The worlds'
const arrival = 'A World of Ideas'

test('WebGL gateway, guarded departure, arrival, and return are functional', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  const app = page.locator('.cosmic-app')
  await expect(app).toHaveAttribute('data-graphics', 'live')
  await expect(page.getByRole('heading', { name: welcome })).toBeVisible()
  await expect(page.getByRole('button', { name: launch })).toBeVisible()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'artifacts/redesign-desktop.png', fullPage: true })
  await page.getByRole('button', { name: launch }).evaluate((button: HTMLButtonElement) => { button.click(); button.click() })
  await expect(app).toHaveAttribute('data-phase', 'departing')
  await expect(page.getByRole('button', { name: 'The worlds' })).toBeDisabled()
  await expect(app).toHaveAttribute('data-phase', 'arrival')
  await expect(page.getByRole('heading', { name: arrival, exact: true })).toBeFocused()
  await expect(page.getByText('Discover the story behind Vidyu, my school-management SaaS project.')).toBeVisible()
  await page.waitForTimeout(850)
  await page.screenshot({ path: 'artifacts/redesign-arrival.png', fullPage: true })
  await page.getByRole('button', { name: 'Return to Gateway', exact: true }).click()
  await expect(app).toHaveAttribute('data-phase', 'gateway')
  await expect(page.getByRole('button', { name: launch })).toBeFocused()
  expect(errors).toEqual([])
})

test('single spacecraft launch and atlas support keyboard dismissal', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const discover = page.getByRole('button', { name: atlas })
  await discover.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close world index' })).toBeFocused()
  await expect(dialog.getByText('Future destination')).toHaveCount(4)
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Visit Vidyu World' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(discover).toBeFocused()
  await discover.click()
  await page.screenshot({ path: 'artifacts/redesign-atlas.png' })
  await page.getByRole('button', { name: 'Close world index' }).click()
  await page.getByRole('button', { name: launch }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-phase', 'arrival')
})

test('mobile touch navigation is compact and narrow layouts do not overflow', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-graphics', 'live')
  await expect(page.getByRole('button', { name: launch })).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true)
  await page.screenshot({ path: 'artifacts/redesign-mobile.png', fullPage: true })
  await page.getByRole('button', { name: launch }).tap()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-phase', 'arrival')
  await page.screenshot({ path: 'artifacts/redesign-mobile-arrival.png', fullPage: true })
  await page.getByRole('button', { name: 'Return to Gateway', exact: true }).tap()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-phase', 'gateway')
  await page.setViewportSize({ width: 320, height: 568 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: atlas }).tap()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.keyboard.press('Escape')
  await page.screenshot({ path: 'artifacts/redesign-small-mobile.png', fullPage: true })
  await page.setViewportSize({ width: 844, height: 390 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: launch }).tap()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-phase', 'arrival')
  await page.getByRole('button', { name: 'Return to Gateway', exact: true }).tap()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-phase', 'gateway')
  await context.close()
})

test('laptop and tablet compositions keep controls clear of the destination', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 375, height: 667 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await expect(page.locator('.cosmic-app')).toHaveAttribute('data-graphics', 'live')
    await expect(page.getByRole('button', { name: launch })).toBeInViewport()
    const hero = await page.locator('.hero-content').boundingBox()
    expect(hero).not.toBeNull()
    await expect(page.getByRole('button', { name: launch })).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: `artifacts/redesign-${viewport.width}.png`, fullPage: true })
  }
})

test('pointer parallax follows smoothly, resets, and planet has a keyboard action', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-graphics', 'live')
  const target = page.getByRole('button', { name: launch })
  await page.mouse.move(720, 450)
  await page.waitForTimeout(450)
  const center = (await target.boundingBox())!
  await page.mouse.move(1390, 130)
  await page.waitForTimeout(950)
  const moved = (await target.boundingBox())!
  expect(Math.abs(moved.x - center.x) + Math.abs(moved.y - center.y)).toBeLessThan(4)
  await page.screenshot({ path: 'artifacts/redesign-pointer.png' })
  await page.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent('pointerleave')))
  await page.waitForTimeout(1100)
  const settled = (await target.boundingBox())!
  expect(Math.abs(settled.x - center.x) + Math.abs(settled.y - center.y)).toBeLessThan(4)
  await page.screenshot({ path: 'artifacts/redesign-ship-hover.png' })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await target.focus()
  await expect(target).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-phase', 'arrival')
})

test('reduced motion sleeps at rest and uses one animation scheduler during travel', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeRequest = window.requestAnimationFrame.bind(window)
    const nativeCancel = window.cancelAnimationFrame.bind(window)
    const pending = new Set<number>()
    const stats = { peak: 0, calls: 0 }
    Object.defineProperty(window, '__frameStats', { value: stats })
    window.requestAnimationFrame = (callback) => {
      let id = 0
      id = nativeRequest((now) => { pending.delete(id); callback(now) })
      pending.add(id)
      stats.calls++
      stats.peak = Math.max(stats.peak, pending.size)
      return id
    }
    window.cancelAnimationFrame = (id) => { pending.delete(id); nativeCancel(id) }
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-graphics', 'live')
  await page.waitForTimeout(350)
  const calls = () => page.evaluate(() => (window as unknown as { __frameStats: { calls: number } }).__frameStats.calls)
  const before = await calls()
  await page.waitForTimeout(500)
  expect(await calls()).toBe(before)
  await page.getByRole('button', { name: launch }).click()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-phase', 'arrival', { timeout: 1800 })
  await page.getByRole('button', { name: 'Return to Gateway', exact: true }).click()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-phase', 'gateway', { timeout: 1800 })
  expect(await page.evaluate(() => (window as unknown as { __frameStats: { peak: number } }).__frameStats.peak)).toBe(1)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-reduced-motion', 'false')
})

test('a WebGL-unavailable browser can still explore and return', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
      return Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-graphics', 'lightweight')
  await page.screenshot({ path: 'artifacts/redesign-fallback.png', fullPage: true })
  await page.getByRole('button', { name: launch }).click()
  await expect(page.getByRole('heading', { name: arrival, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Return to Gateway', exact: true }).click()
  await expect(page.getByRole('heading', { name: welcome })).toBeVisible()
})

test('WebGL context loss preserves navigation in the lightweight scene', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-graphics', 'live')
  await page.getByRole('button', { name: launch }).click()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-phase', 'arrival')
  await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext()
  })
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-graphics', 'lightweight')
  await page.getByRole('button', { name: 'Return to Gateway', exact: true }).click()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-phase', 'gateway')
})

test('Gateway interrupts a flight and still-scene navigation needs no renderer', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: launch }).click()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-phase', 'departing')
  await page.getByRole('button', { name: 'Gateway', exact: true }).click()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-phase', 'gateway')
  await page.getByRole('button', { name: 'Use lightweight still scene' }).click()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-graphics', 'lightweight')
  await expect(page.locator('canvas')).toHaveCount(0)
  await page.getByRole('button', { name: launch }).click()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-phase', 'arrival')
  await page.getByRole('button', { name: 'Return to Gateway', exact: true }).click()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-phase', 'gateway')
  await page.getByRole('button', { name: 'Enable live 3D scene' }).click()
  await expect(page.locator('.cosmic-app')).toHaveAttribute('data-graphics', 'live')
})
