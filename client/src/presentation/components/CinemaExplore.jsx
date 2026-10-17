import { useEffect, useState } from 'react'
import { listExploreMovies, listUpcomingMovies, searchMovies } from '../../infrastructure/api/moviesApi'
import { FilmPoster } from './CinemaRecap'

export function CinemaExplore() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('trending')
  const [request, setRequest] = useState({ mode: 'trending', query: '' })
  useEffect(() => {
    let cancelled = false
    const operation = request.query ? searchMovies(request.query) : request.mode === 'upcoming' ? listUpcomingMovies() : listExploreMovies().then(result => result.items ?? [])
    operation.then(result => { if (!cancelled) { setItems(result); setError('') } }).catch(() => { if (!cancelled) setError('Les films ne sont pas disponibles pour le moment. Réessaie dans un instant.') }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [request])
  function load(nextMode, nextQuery = '') { setLoading(true); setError(''); setMode(nextMode); setRequest({ mode: nextMode, query: nextQuery }) }
  return <section className="cinema-explore" aria-labelledby="cinema-explore-title"><header className="cinema-view-heading"><div><h2 id="cinema-explore-title">La prochaine histoire.</h2><p>Recherche, tendances et prochaines sorties avec TMDb.</p></div></header>
    <form className="cinema-explore-search" onSubmit={event => { event.preventDefault(); load('search', query.trim()) }}><label><span className="sr-only">Titre à chercher sur TMDb</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Un film en tête ?" required /></label><button type="submit">Rechercher</button></form>
    <div className="cinema-explore-filters" aria-label="Sélection de films"><button type="button" aria-pressed={mode === 'trending'} onClick={() => { setQuery(''); load('trending') }}>Tendances</button><button type="button" aria-pressed={mode === 'upcoming'} onClick={() => { setQuery(''); load('upcoming') }}>À venir</button></div>
    {loading ? <div className="cinema-skeleton-grid" role="status"><span className="sr-only">Chargement des films…</span>{[0, 1, 2, 3, 4, 5].map(i => <div key={i} />)}</div> : error ? <div className="cinema-empty" role="alert"><p>{error}</p><button type="button" onClick={() => load(request.mode, request.query)}>Réessayer</button></div> : items.length ? <div className="cinema-film-grid">{items.map(movie => <article key={movie.tmdb_id} className="cinema-film"><FilmPoster film={{ title: movie.title, metadata: movie }} /><h3>{movie.title}</h3><p>{movie.release_date?.slice(0, 4) || 'Date à venir'}</p><a href={`https://www.themoviedb.org/movie/${movie.tmdb_id}`} target="_blank" rel="noreferrer">Voir la fiche<span className="sr-only"> de {movie.title} sur TMDb (nouvel onglet)</span></a></article>)}</div> : <p className="cinema-empty">Aucun film trouvé. Essaie un autre titre.</p>}
  </section>
}
