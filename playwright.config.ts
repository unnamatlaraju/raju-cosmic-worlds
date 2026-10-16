import { defineConfig } from '@playwright/test'
import { resolve } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

// Keep browser binaries, profiles, and test artifacts inside the project.
process.env.PLAYWRIGHT_BROWSERS_PATH = resolve('.browsers')
mkdirSync(resolve('.runtime'), { recursive: true })
process.env.TMPDIR = resolve('.runtime')
process.env.XDG_CACHE_HOME = resolve('.runtime')
if (existsSync('.runtime/lib')) {
  process.env.LD_LIBRARY_PATH = [resolve('.runtime/lib/usr/lib/x86_64-linux-gnu'), resolve('.runtime/lib/lib/x86_64-linux-gnu')].join(':')
  process.env.FONTCONFIG_FILE = resolve('.runtime/fonts.conf')
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 35_000,
  expect: { timeout: 12_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174',
    viewport: { width: 1440, height: 900 },
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
  },
})
