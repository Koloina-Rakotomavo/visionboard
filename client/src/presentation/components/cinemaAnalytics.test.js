import { test } from 'node:test'
import assert from 'node:assert/strict'
import { timeSummary, actorSummary, analyzeCinema, analyzeYears, formatDays } from './cinemaAnalytics.js'
import { normalizeFilms, movieKey } from './cinemaRecap.js'

const records = normalizeFilms([
  { id: 'a', title: 'One', release_year: '2020', watched_date: '2026', viewing_mode: 'Cinéma', duration_minutes: 120 },
  { id: 'b', title: 'Two', release_year: '2021', watched_date: '2025', viewing_mode: 'Streaming', duration_minutes: null },
  { id: 'c', title: 'One', release_year: '2020', watched_date: null, viewing_mode: 'Cinéma', duration_minutes: null },
  { id: 'd', title: 'Missing', release_year: '2024', watched_date: null, viewing_mode: null, duration_minutes: null },
])
const catalog = { [movieKey(records[0])]: { tmdb_id: 1, runtime: 125 }, [movieKey(records[1])]: { tmdb_id: 2, runtime: 90 } }
const credits = { movies: { 1: [10, 10, 20], 2: [10, 30] }, people: { 10: { id: 10, name: 'A' }, 20: { id: 20, name: 'B' }, 30: { id: 30, name: 'C' } } }

test('time distinguishes source, TMDB estimates, and absent durations', () => {
  assert.deepEqual(timeSummary(records, catalog), { minutes: 335, confirmedMinutes: 120, estimatedMinutes: 215, confirmed: 1, estimated: 2, known: 3, missing: 1, total: 4 })
  const data = analyzeCinema(records, catalog, credits)
  assert.equal(data.cinemaTime.minutes, 245)
  assert.equal(data.totalTime.minutes, 335)
  assert.equal(data.unknownSupports, 1)
  assert.equal(formatDays(1440), '1')
  assert.equal(data.films, 3)
})

test('actor ranking deduplicates multiple roles but counts rewatches; unknown year enters lifetime only', () => {
  const ranking = actorSummary(records, catalog, credits)
  assert.equal(ranking.ranking[0].name, 'A')
  assert.equal(ranking.ranking[0].count, 3)
  assert.equal(ranking.ranking[0].filmCount, 2)
  assert.equal(ranking.covered, 3)
  const years = analyzeYears(records, catalog, credits)
  assert.equal(years.length, 2)
  assert.equal(years[0].year, '2026')
  assert.equal(years[0].actors.leaders.length, 2)
  assert.equal(years[0].actors.ranking[0].count, 1)
  assert.equal(years.reduce((sum, year) => sum + year.sessions, 0), 2)
})

test('empty casts are complete data rather than errors; missing casts do not invent winners', () => {
  const empty = actorSummary(records, catalog, { movies: { 1: [] }, people: {} })
  assert.equal(empty.covered, 2)
  assert.equal(empty.ranking.length, 0)
  assert.equal(actorSummary([], {}, { movies: {}, people: {} }).covered, 0)
})

test('casting scope is explicit and does not hide ties', () => {
  const full = actorSummary(records, catalog, credits)
  const firstOnly = actorSummary(records, catalog, credits, 1)
  assert.equal(full.ranking.length, 3)
  assert.equal(firstOnly.ranking.length, 1)
  assert.equal(firstOnly.ranking[0].name, 'A')
  assert.equal(firstOnly.ranking[0].count, 3)
})
