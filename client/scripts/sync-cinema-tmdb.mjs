// Enrich the public cinema snapshot using this project's TMDB proxy.
// No Google credentials or TMDB key belong in the client or the repository.
import { readFile, writeFile } from 'node:fs/promises'
const input = new URL('../src/data/cinema-sheet.json', import.meta.url)
const output = new URL('../src/data/cinema-tmdb.json', import.meta.url)
const { records } = JSON.parse(await readFile(input, 'utf8'))
const catalog = JSON.parse(await readFile(output, 'utf8').catch(() => '{}'))
const base = process.env.CINEMA_API_URL ?? 'https://visionboard-api-x1q2.onrender.com'
const key = record => `${record.title.trim().toLowerCase()}::${record.release_year ?? ''}`
const unique = [...new Map(records.map(record => [key(record), record])).values()]
let cursor = 0
let failures = 0
async function worker() {
  while (cursor < unique.length) {
    const record = unique[cursor++]
    if (Object.hasOwn(catalog, key(record))) continue
    try {
      const query = new URLSearchParams({ title: record.title, year: record.release_year ?? '' })
      const response = await fetch(`${base}/api/movies/metadata?${query}`, { signal: AbortSignal.timeout(25000) })
      if (!response.ok) throw Error(`HTTP ${response.status}`)
      catalog[key(record)] = (await response.json()).item
    } catch { failures++ }
  }
}
await Promise.all([worker(), worker(), worker()])
await writeFile(output, JSON.stringify(catalog, null, 2) + '\n')
console.log(`${Object.values(catalog).filter(Boolean).length} movies enriched; ${failures} requests to retry.`)
if (failures) process.exitCode = 1
