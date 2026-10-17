import { useEffect, useState } from 'react'
import seed from '../../data/cinema-tmdb.json'
import { movieKey } from '../components/cinemaRecap'
import { resolveMovieMetadata } from '../../infrastructure/api/moviesApi'

const inFlight = new Map()
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
    const missing = records.filter(record => !Object.hasOwn(seed, movieKey(record)))
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
    void Promise.all([worker(), worker()])
    return () => { cancelled = true }
  }, [records])
  return { catalog, failed }
}
