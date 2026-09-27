const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

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

export const listSavedMovies = async () => {
  const response = await fetch(buildApiUrl('/api/movies'))
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

export const importLetterboxd = async (file) => {
  const formData = new FormData()
  formData.append('export', file)
  const response = await fetch(buildApiUrl('/api/movies/import-letterboxd'), {
    method: 'POST',
    body: formData,
  })
  return parseJsonResponse(response)
}

export const listLetterboxdReviews = async () => {
  const response = await fetch(buildApiUrl('/api/letterboxd/reviews'))
  const data = await parseJsonResponse(response)
  return data.items ?? []
}

export const listLetterboxdComments = async () => {
  const response = await fetch(buildApiUrl('/api/letterboxd/comments'))
  const data = await parseJsonResponse(response)
  return data.items ?? []
}

export const createMovie = async (movie) => {
  const response = await fetch(buildApiUrl('/api/movies'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(movie),
  })

  const data = await parseJsonResponse(response)
  return data.item
}

export const updateMovie = async (id, movie) => {
  const response = await fetch(buildApiUrl(`/api/movies/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(movie),
  })

  const data = await parseJsonResponse(response)
  return data.item
}

export const deleteMovie = async (id) => {
  const response = await fetch(buildApiUrl(`/api/movies/${id}`), {
    method: 'DELETE',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error ?? 'Erreur API')
  }
}
