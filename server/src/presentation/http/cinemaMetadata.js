// Public movie metadata only. Credentials stay in callTmdb on the server.
const normalizeTitle = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const cache = new Map()
const pending = new Map()

export function selectMovieMatch(results, title, year) {
  const query = normalizeTitle(title)
  const scored = results.filter(movie => !year || String(movie.release_date ?? '').slice(0, 4) === String(year)).map(movie => {
    const titles = [movie.title, movie.original_title].map(normalizeTitle).filter(Boolean)
    const score = Math.max(...titles.map(candidate => {
      if (candidate === query) return 1
      if (candidate.startsWith(query + ' ') && query.length > 3) return .9
      const a = new Set(query.split(' ')), b = new Set(candidate.split(' '))
      return [...a].filter(word => b.has(word)).length / Math.max(a.size, b.size)
    }))
    return { movie, score }
  }).filter(item => item.score >= .75)
  // Popularity resolves same-title shorts vs feature films; title and year still gate the match.
  return scored.sort((a, b) => (b.score + Math.min(.28, Math.log10(1 + (b.movie.popularity ?? 0)) / 12) + Math.min(.3, Math.log10(1 + (b.movie.vote_count ?? 0)) / 10)) - (a.score + Math.min(.28, Math.log10(1 + (a.movie.popularity ?? 0)) / 12) + Math.min(.3, Math.log10(1 + (a.movie.vote_count ?? 0)) / 10)))[0]?.movie ?? null
}

export function createMovieResolver(callTmdb) {
  return async (title, year) => {
    const key = `${normalizeTitle(title)}::${year ?? ''}`
    const cached = cache.get(key)
    if (cached && cached.expires > Date.now()) return cached.item
    if (pending.has(key)) return pending.get(key)
    const task = (async () => {
      const search = await callTmdb('/search/movie', { query: title, year: year || undefined, language: 'fr-FR', include_adult: 'false' })
      const match = selectMovieMatch(search.results ?? [], title, year)
      if (!match) return null
      const movie = await callTmdb(`/movie/${match.id}`, { language: 'fr-FR', append_to_response: 'credits' })
      const image = (value, size) => value ? `https://image.tmdb.org/t/p/${size}${value}` : null
      const item = {
        tmdb_id: movie.id, title: movie.title, original_title: movie.original_title,
        release_date: movie.release_date, poster_url: image(movie.poster_path, 'w500'),
        backdrop_url: image(movie.backdrop_path, 'w1280'), overview: movie.overview,
        genres: (movie.genres ?? []).map(genre => ({ id: genre.id, name: genre.name })),
        directors: (movie.credits?.crew ?? []).filter(person => person.job === 'Director').map(person => ({ id: person.id, name: person.name, profile_url: image(person.profile_path, 'w185') })),
        runtime: movie.runtime || null, vote_average: movie.vote_average,
      }
      if (cache.size >= 2000) cache.delete(cache.keys().next().value)
      cache.set(key, { item, expires: Date.now() + 86400000 })
      return item
    })()
    pending.set(key, task)
    try { return await task } finally { pending.delete(key) }
  }
}
