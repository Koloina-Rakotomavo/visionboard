import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeFilms, filterYear, movieKey, recapSummary } from './cinemaRecap.js'
import { selectMovieMatch } from '../../../../server/src/presentation/http/cinemaMetadata.js'

test('recap keeps rewatches, missing metadata, and source durations distinct', () => {
  const records = normalizeFilms([
    { id: 'a', title: 'Dune', release_year: '2021', watched_date: '2026', duration_minutes: 155, viewing_mode: 'Cinema', company: 'ensemble' },
    { id: 'b', title: 'Dune', release_year: '2021', watched_date: '2026', duration_minutes: null },
    { id: 'c', title: 'Unknown', release_year: '2025', watched_date: null, duration_minutes: null },
  ])
  const metadata = { tmdb_id: 1, genres: [{ id: 1, name: 'Science-fiction' }, { id: 2, name: 'Aventure' }], directors: [{ id: 1, name: 'Denis Villeneuve' }], runtime: 155, poster_url: 'poster' }
  const result = recapSummary(records, { [movieKey(records[0])]: metadata })
  assert.equal(result.sessions, 3)
  assert.equal(result.filmCount, 2)
  assert.equal(result.matched, 2)
  assert.equal(result.minutes, 155) // No backfill of the unknown session duration.
  assert.equal(result.knownDurations, 1)
  assert.equal(result.genres[0].count, 2)
  assert.equal(result.posters.length, 1)
  assert.equal(result.cinema, 1)
  assert.equal(result.premium.known, 0)
  assert.equal(filterYear(records, '2026').length, 2)
  assert.equal(filterYear(records, 'unknown').length, 1)
  assert.equal(recapSummary([], {}).longest, null)
})

test('matching rejects different years and unrelated titles, prefers established feature over same-title short', () => {
  const movies = [
    { id: 1, title: 'FLOW', release_date: '2024-02-01', popularity: .2, vote_count: 1 },
    { id: 2, title: "Flow, le chat qui n’avait plus peur de l’eau", original_title: 'Straume', release_date: '2024-08-01', popularity: 15, vote_count: 4000 },
    { id: 3, title: 'Hustle & Flow', release_date: '2005-01-01', popularity: 20, vote_count: 6000 },
  ]
  assert.equal(selectMovieMatch(movies, 'Flow', '2024')?.id, 2)
  assert.equal(selectMovieMatch(movies, 'Flow', '2026'), null)
  assert.equal(selectMovieMatch(movies, 'Completely unrelated film', '2024'), null)
})
