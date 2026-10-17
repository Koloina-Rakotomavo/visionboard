// Read public TMDB credits in bounded batches. Names and photos share one directory.
import { readFile, writeFile } from 'node:fs/promises'
const catalog = JSON.parse(await readFile(new URL('../src/data/cinema-tmdb.json', import.meta.url), 'utf8'))
const output = new URL('../src/data/cinema-cast.json', import.meta.url)
const data = JSON.parse(await readFile(output, 'utf8').catch(() => '{"movies":{},"people":{}}'))
const ids = [...new Set(Object.values(catalog).filter(Boolean).map(movie => movie.tmdb_id))].filter(id => !Object.hasOwn(data.movies, String(id)))
const batches = Array.from({ length: Math.ceil(ids.length / 30) }, (_, i) => ids.slice(i * 30, (i + 1) * 30))
const base = process.env.CINEMA_API_URL ?? 'https://visionboard-api-x1q2.onrender.com'
let cursor = 0, failures = 0
async function worker() {
  while (cursor < batches.length) {
    const batch = batches[cursor++]
    try {
      const response = await fetch(`${base}/api/movies/casts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: batch }), signal: AbortSignal.timeout(60000) })
      if (!response.ok) throw Error(`HTTP ${response.status}`)
      const result = await response.json()
      Object.assign(data.movies, result.movies)
      Object.assign(data.people, result.people)
      failures += result.failed.length
    } catch { failures += batch.length }
  }
}
await Promise.all([worker(), worker()])
await writeFile(output, JSON.stringify(data) + '\n')
console.log(`${Object.keys(data.movies).length} casts available; ${failures} requests to retry.`)
if (failures) process.exitCode = 1
