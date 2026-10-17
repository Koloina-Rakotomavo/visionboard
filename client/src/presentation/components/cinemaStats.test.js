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
