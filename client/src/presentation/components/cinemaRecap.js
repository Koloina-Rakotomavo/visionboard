import { categorySummary, normalizeRecord, summarize, watchedYear } from './cinemaStats.js'

export const movieKey = record => `${record.title.trim().toLowerCase()}::${record.release_year ?? ''}`
export const normalizeFilms = records => records.map(normalizeRecord)
export const filterYear = (records, year) => records.filter(record => year === 'all' || (year === 'unknown' ? !watchedYear(record.watched_date) : watchedYear(record.watched_date) === year))

export function recapSummary(records, catalog) {
  const films = records.map(record => ({ ...record, metadata: catalog[movieKey(record)] ?? null }))
  const matched = films.filter(film => film.metadata)
  const genres = new Map(), directors = new Map()
  for (const film of matched) {
    for (const genre of film.metadata.genres ?? []) {
      const current = genres.get(genre.id) ?? { ...genre, count: 0 }
      genres.set(genre.id, { ...current, count: current.count + 1 })
    }
    for (const director of film.metadata.directors ?? []) {
      const current = directors.get(director.id) ?? { ...director, count: 0 }
      directors.set(director.id, { ...current, count: current.count + 1 })
    }
  }
  const sort = (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr')
  const durations = films.filter(film => Number.isFinite(film.duration_minutes) && film.duration_minutes > 0).sort((a, b) => b.duration_minutes - a.duration_minutes)
  const cinema = films.filter(film => film.viewing_mode === 'Cinéma')
  const company = categorySummary(films, 'company')
  return {
    ...summarize(records), filmCount: summarize(records).films, films, matched: matched.length,
    posters: [...new Map(matched.filter(film => film.metadata.poster_url).map(film => [film.metadata.tmdb_id, film])).values()],
    genres: [...genres.values()].sort(sort), directors: [...directors.values()].sort(sort),
    longest: durations[0] ?? null, cinema: cinema.length,
    modes: categorySummary(films, 'viewing_mode'), company,
    accompanied: company.groups.filter(group => ['Accompagnée', 'En date'].includes(group.label)).reduce((sum, group) => sum + group.count, 0),
    premium: categorySummary(cinema, 'premium'),
  }
}
