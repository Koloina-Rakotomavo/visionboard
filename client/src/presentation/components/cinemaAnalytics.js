import { movieKey, filterYear } from './cinemaRecap.js'
import { summarize, watchedYear } from './cinemaStats.js'

export const formatHours = minutes => { const rounded = Math.round(minutes); return `${Math.floor(rounded / 60)} h ${String(rounded % 60).padStart(2, '0')}` }
export const formatDays = minutes => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(minutes / 1440)
export const percentOf = (value, total) => total ? Math.round(value / total * 100) : null

export function timeSummary(records, catalog) {
  let confirmedMinutes = 0, estimatedMinutes = 0, confirmed = 0, estimated = 0
  for (const record of records) {
    if (Number.isFinite(record.duration_minutes) && record.duration_minutes > 0) {
      confirmedMinutes += record.duration_minutes
      confirmed++
    } else {
      const runtime = catalog[movieKey(record)]?.runtime
      if (Number.isFinite(runtime) && runtime > 0) { estimatedMinutes += runtime; estimated++ }
    }
  }
  return { minutes: confirmedMinutes + estimatedMinutes, confirmedMinutes, estimatedMinutes, confirmed, estimated, known: confirmed + estimated, missing: records.length - confirmed - estimated, total: records.length }
}

export function actorSummary(records, catalog, credits = { movies: {}, people: {} }, limit = Infinity) {
  const people = new Map()
  let covered = 0
  for (const record of records) {
    const movie = catalog[movieKey(record)]
    if (!movie || !Object.hasOwn(credits.movies, String(movie.tmdb_id))) continue
    covered++
    // A person credited for multiple roles still appears only once per viewing.
    const castIds = [...new Set(credits.movies[String(movie.tmdb_id)])].slice(0, limit)
    for (const [position, id] of castIds.entries()) {
      const person = credits.people[String(id)]
      if (!person) continue
      const current = people.get(id) ?? { ...person, count: 0, billingScore: 0, filmIds: new Set() }
      current.count++
      current.billingScore += 1 / (position + 1)
      current.filmIds.add(movie.tmdb_id)
      people.set(id, current)
    }
  }
  const ranking = [...people.values()].map(person => ({ ...person, filmCount: person.filmIds.size, filmIds: [...person.filmIds] }))
    .sort((a, b) => b.count - a.count || b.filmCount - a.filmCount || b.billingScore - a.billingScore || a.name.localeCompare(b.name, 'fr'))
  const leaders = ranking.filter(person => person.count === ranking[0]?.count)
  return { ranking, leaders, covered, missing: records.length - covered, total: records.length }
}

export function analyzeCinema(records, catalog, credits, castLimit = Infinity) {
  const cinema = records.filter(record => record.viewing_mode === 'Cinéma')
  return {
    ...summarize(records),
    totalTime: timeSummary(records, catalog),
    cinemaTime: timeSummary(cinema, catalog),
    cinema: cinema.length, unknownSupports: records.filter(record => record.viewing_mode === 'Non renseigné').length,
    actors: actorSummary(records, catalog, credits, castLimit),
    leadingActors: actorSummary(records, catalog, credits, 10),
  }
}

export function analyzeYears(records, catalog, credits, castLimit = Infinity) {
  const years = [...new Set(records.map(record => watchedYear(record.watched_date)).filter(Boolean))].sort().reverse()
  return years.map(year => ({ year, ...analyzeCinema(filterYear(records, year), catalog, credits, castLimit) }))
}
