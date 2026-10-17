import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanCategory, groupCounts, summarize, watchedYear } from './cinemaStats.js'

test('year-only dates stay year-only; unknown and release year are not substituted', () => {
  assert.equal(watchedYear('2026'), '2026')
  assert.equal(watchedYear('every year'), null)
  assert.equal(watchedYear(null), null)
  assert.equal(watchedYear('2025-10-03'), '2025')
})
test('missing and error cells form a visible unknown bucket', () => {
  assert.equal(cleanCategory('#ERROR!'), 'Non renseigné')
  assert.deepEqual(groupCounts([{ mode: null }, { mode: '#ERROR!' }], 'mode'), [{ label: 'Non renseigné', count: 2 }])
})
test('rewatches remain sessions; missing durations are not zero estimates', () => {
  const data = [
    { title: 'Dune', release_year: '2021', watched_date: '2026', duration_minutes: 155 },
    { title: 'Dune', release_year: '2021', watched_date: null, duration_minutes: null },
  ]
  assert.deepEqual(summarize(data), { sessions: 2, films: 1, minutes: 155, knownDurations: 1, unknownYears: 1 })
})

test('category normalization merges spelling variants without inferring missing values', async () => {
  const { normalizeRecord, categorySummary, annualCounts } = await import('./cinemaStats.js')
  const records = [
    { viewing_mode: ' Cinema', platform: 'Amazone Prime', company: 'ensemble', watched_date: '2026', premium: 'Non' },
    { viewing_mode: 'Cinéma', watched_date: '2025', premium: null },
    { viewing_mode: '#ERROR!', watched_date: 'every year' },
  ].map(normalizeRecord)
  assert.equal(records[0].platform, 'Amazon Prime')
  assert.equal(records[0].company, 'Accompagnée')
  assert.equal(records[1].premium, 'Non renseigné')
  assert.deepEqual(categorySummary(records, 'viewing_mode'), { groups: [{ label: 'Cinéma', count: 2 }], known: 2, missing: 1, total: 3 })
  assert.deepEqual(annualCounts(records), [{ label: '2025', count: 1 }, { label: '2026', count: 1 }])
  assert.deepEqual(categorySummary([], 'viewing_mode'), { groups: [], known: 0, missing: 0, total: 0 })
})
