import { useState } from 'react'
import { FilmPoster } from './CinemaRecap'

export function CinemaLibrary({ stats }) {
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('all')
  const normalized = query.trim().toLocaleLowerCase('fr-FR')
  const films = stats.films.filter(film => film.title.toLocaleLowerCase('fr-FR').includes(normalized) && (genre === 'all' || film.metadata?.genres.some(item => String(item.id) === genre)))
  return <section className="cinema-library" aria-labelledby="cinema-library-title">
    <header className="cinema-view-heading"><div><h2 id="cinema-library-title">Toutes ces histoires.</h2><p>{stats.sessions} visionnages dans cette sélection.</p></div></header>
    <div className="cinema-library-tools"><label><span className="sr-only">Rechercher un film</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Retrouver un film…" /></label><label><span className="sr-only">Filtrer par genre</span><select value={genre} onChange={event => setGenre(event.target.value)}><option value="all">Tous les genres</option>{stats.genres.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
    <p className="cinema-result-count" role="status">{films.length} résultat{films.length > 1 ? 's' : ''}{genre !== 'all' ? ' · parmi les films reconnus par TMDb' : ''}</p>
    {films.length ? <div className="cinema-film-grid">{films.map(film => <article key={film.id} className="cinema-film"><FilmPoster film={film} /><h3>{film.title}</h3><p>{film.release_year ?? 'Année inconnue'}{film.viewing_mode !== 'Non renseigné' ? ` · ${film.viewing_mode}` : ''}</p>{film.metadata && <a href={`https://www.themoviedb.org/movie/${film.metadata.tmdb_id}`} target="_blank" rel="noreferrer">Voir la fiche<span className="sr-only"> de {film.title} sur TMDb (nouvel onglet)</span></a>}</article>)}</div> : <div className="cinema-empty"><h3>Aucun film dans cette sélection.</h3><p>Essaie un autre titre, un autre genre ou une autre année.</p><button type="button" onClick={() => { setQuery(''); setGenre('all') }}>Effacer les filtres</button></div>}
  </section>
}
