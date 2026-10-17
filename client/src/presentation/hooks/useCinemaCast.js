import { useEffect, useState } from 'react'
import { fetchMovieCast } from '../../infrastructure/api/moviesApi'

const EMPTY = { movies: {}, people: {} }
let dataPromise
const inFlight = new Map()
function loadCredits() {
  dataPromise ??= fetch(new URL('../../data/cinema-cast.json', import.meta.url))
    .then(response => { if (!response.ok) throw Error('Casting indisponible'); return response.json() })
    .catch(error => { dataPromise = null; throw error })
  return dataPromise
}
function resolveCast(id) {
  if (!inFlight.has(id)) inFlight.set(id, fetchMovieCast(id).catch(error => { inFlight.delete(id); throw error }))
  return inFlight.get(id)
}

export function useCinemaCast(catalog) {
  const [credits, setCredits] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    async function load() {
      let seed = EMPTY
      try { seed = await loadCredits() } catch { /* The live endpoint can still fill the casts. */ }
      if (cancelled) return
      setCredits(current => ({ movies: { ...current.movies, ...seed.movies }, people: { ...current.people, ...seed.people } }))
      const ids = [...new Set(Object.values(catalog).filter(Boolean).map(movie => movie.tmdb_id))].filter(id => !Object.hasOwn(seed.movies, String(id)))
      let cursor = 0
      async function worker() {
        while (!cancelled && cursor < ids.length) {
          const id = ids[cursor++]
          try {
            const cast = await resolveCast(id)
            if (!cancelled) setCredits(current => ({ movies: { ...current.movies, [id]: cast.map(person => person.id) }, people: { ...current.people, ...Object.fromEntries(cast.map(person => [person.id, person])) } }))
          } catch { break }
        }
      }
      await Promise.all([worker(), worker()])
      if (!cancelled) setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [catalog])
  return { credits, loading }
}
