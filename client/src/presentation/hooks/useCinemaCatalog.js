import { useEffect, useState } from 'react'
import seed from '../../data/cinema-tmdb-featured.json'
import { movieKey } from '../components/cinemaRecap'
import { resolveMovieMetadata } from '../../infrastructure/api/moviesApi'

const inFlight = new Map()
let fullCatalog
function loadCatalog() {
  fullCatalog ??= fetch(new URL('../../data/cinema-tmdb.json', import.meta.url))
    .then(response => { if (!response.ok) throw Error('Catalogue indisponible'); return response.json() })
    .catch(error => { fullCatalog = null; throw error })
  return fullCatalog
}
function resolve(record) {
  const key = movieKey(record)
  if (!inFlight.has(key)) {
    inFlight.set(key, resolveMovieMetadata(record).catch(error => { inFlight.delete(key); throw error }))
  }
  return inFlight.get(key)
}

export function useCinemaCatalog(records) {
  const [catalog, setCatalog] = useState(seed)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let cancelled = false
    async function enrich() {
      let available = seed
      if (records.some(record => !Object.hasOwn(seed, movieKey(record)))) {
        try { available = await loadCatalog() } catch { /* Fall back to the live lookup. */ }
      }
      if (cancelled) return
      setCatalog(current => ({ ...current, ...available, ...seed }))
      const missing = records.filter(record => !Object.hasOwn(available, movieKey(record)) && !Object.hasOwn(seed, movieKey(record)))
      let cursor = 0
      async function worker() {
        while (!cancelled && cursor < missing.length) {
          const record = missing[cursor++]
          try {
            const item = await resolve(record)
            if (!cancelled) setCatalog(current => ({ ...current, [movieKey(record)]: item }))
          } catch {
            if (!cancelled) setFailed(true)
            break
          }
        }
      }
      await Promise.all([worker(), worker()])
    }
    void enrich()
    return () => { cancelled = true }
  }, [records])
  return { catalog, failed }
}
