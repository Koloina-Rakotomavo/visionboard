const API_BASE_URL = import.meta.env?.VITE_API_URL?.replace(/\/$/, '') ?? ''

const buildApiUrl = (path) => `${API_BASE_URL}${path}`

const parseJsonResponse = async (response) => {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error ?? 'Erreur API')
  }

  return data
}

export const searchMovies = async (query) => {
  const response = await fetch(buildApiUrl(`/api/movies/search?q=${encodeURIComponent(query)}`))
  const data = await parseJsonResponse(response)
  return data.items
}

export const listUpcomingMovies = async () => {
  const response = await fetch(buildApiUrl('/api/movies/upcoming'))
  const data = await parseJsonResponse(response)
  return data.items ?? []
}

export const listExploreMovies = async ({ mode = 'trending_week', page = 1 } = {}) => {
  const params = new URLSearchParams({
    mode,
    page: String(page),
  })
  const response = await fetch(buildApiUrl(`/api/movies/explore?${params.toString()}`))
  return parseJsonResponse(response)
}


export const resolveMovieMetadata = async (record) => {
  const params = new URLSearchParams({ title: record.title, year: record.release_year ?? '' })
  const response = await fetch(buildApiUrl(`/api/movies/metadata?${params}`), { signal: AbortSignal.timeout(20000) })
  const data = await parseJsonResponse(response)
  return data.item
}
