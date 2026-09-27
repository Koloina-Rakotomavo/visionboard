import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  listLetterboxdComments,
  listLetterboxdReviews,
} from '../../infrastructure/api/moviesApi'
import { useFilmsCinema } from '../hooks/useFilmsCinema'

const OPTIONS_STATUT_FILM = [
  { value: 'watchlist', label: 'Liste de lecture' },
  { value: 'watched', label: 'Vue' },
  { value: 'favorites', label: 'Favoris' },
]

const OPTIONS_FILTRE_FILM = [
  { value: 'all', label: 'Tout' },
  { value: 'watchlist', label: 'Liste de lecture' },
  { value: 'watched', label: 'Vue' },
  { value: 'favorites', label: 'Favoris' },
]

const VALEURS_ETOILES_FILM = [1, 2, 3, 4, 5]

function obtenirImageFilm(film) {
  return film.poster_url || film.backdrop_url || null
}

function obtenirLibelleStatutFilm(statut) {
  if (statut === 'favorites') {
    return 'Favori'
  }

  if (statut === 'watched') {
    return 'Vue'
  }

  return 'Watchlist'
}

function EtoilesFilm({ onChange, value }) {
  return (
    <div className="movie-stars" role="radiogroup" aria-label="Note sur 5">
      {VALEURS_ETOILES_FILM.map((starValue) => {
        const isActive = starValue <= value

        return (
          <button
            aria-checked={starValue === value}
            className={`movie-stars__button ${isActive ? 'movie-stars__button--active' : ''}`}
            key={starValue}
            onClick={() => onChange(starValue === value ? 0 : starValue)}
            type="button"
          >
            <span aria-hidden="true">{isActive ? '★' : '☆'}</span>
            <span className="sr-only">{`${starValue} etoiles`}</span>
          </button>
        )
      })}
    </div>
  )
}

function FormulaireFilm({
  libelleBouton,
  noteInitiale = '',
  noteEtoilesInitiale = 0,
  statutInitial = 'watchlist',
  ouvert,
  sauvegardeEnCours,
  ouvrir,
  valider,
  libelleValidation,
}) {
  const [statut, setStatut] = useState(statutInitial)
  const [noteEtoiles, setNoteEtoiles] = useState(noteEtoilesInitiale)
  const [commentaire, setCommentaire] = useState(noteInitiale)

  const validerFormulaire = async (event) => {
    event.preventDefault()
    await valider({
      personal_note: commentaire.trim(),
      personal_rating: noteEtoiles || null,
      personal_status: statut,
    })
  }

  if (!ouvert) {
    return (
      <button className="movie-card__action" onClick={ouvrir} type="button">
        {libelleBouton}
      </button>
    )
  }

  return (
    <form className="movie-editor" onSubmit={validerFormulaire}>
      <label className="saved-movie-card__field">
        <span>Statut</span>
        <select onChange={(event) => setStatut(event.target.value)} value={statut}>
          {OPTIONS_STATUT_FILM.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="saved-movie-card__field">
        <span>Note</span>
        <EtoilesFilm onChange={setNoteEtoiles} value={noteEtoiles} />
      </label>

      <label className="saved-movie-card__field saved-movie-card__field--full">
        <span>Commentaire</span>
        <textarea
          onChange={(event) => setCommentaire(event.target.value)}
          placeholder="Un mot sur ce film si tu veux..."
          rows={3}
          value={commentaire}
        />
      </label>

      <div className="movie-editor__actions">
        <button className="movie-card__action" disabled={sauvegardeEnCours} type="submit">
          {sauvegardeEnCours ? 'Validation...' : libelleValidation}
        </button>
      </div>
    </form>
  )
}

export function CinemaPage() {
  const {
    ajouterFilm,
    chargementFilmsAVenir,
    chargementFilmsSauvegardes,
    enregistrerFilm,
    erreur,
    filmsAVenir,
    filmsSauvegardes,
    importerLetterboxd,
    importationLetterboxdEnCours,
    rechercheEnCours,
    rechercherFilms,
    resultatsRecherche,
    sauvegardeEnCours,
    supprimerFilm,
  } = useFilmsCinema()
  const [recherche, setRecherche] = useState('')
  const [filtreActif, setFiltreActif] = useState('all')
  const [filmEnEdition, setFilmEnEdition] = useState('')
  const [avisLetterboxd, setAvisLetterboxd] = useState([])
  const [commentairesLetterboxd, setCommentairesLetterboxd] = useState([])
  const [chargementLetterboxd, setChargementLetterboxd] = useState(true)
  const [messageImportLetterboxd, setMessageImportLetterboxd] = useState('')

  const filmsSauvegardesFiltres = useMemo(() => {
    if (filtreActif === 'all') {
      return filmsSauvegardes
    }

    return filmsSauvegardes.filter((film) => film.personal_status === filtreActif)
  }, [filtreActif, filmsSauvegardes])

  const validerRecherche = async (event) => {
    event.preventDefault()
    await rechercherFilms(recherche)
  }

  const chargerActiviteLetterboxd = useCallback(async () => {
    setChargementLetterboxd(true)
    try {
      const [avis, commentaires] = await Promise.all([
        listLetterboxdReviews(),
        listLetterboxdComments(),
      ])
      setAvisLetterboxd(avis)
      setCommentairesLetterboxd(commentaires)
    } catch {
      // Letterboxd remains optional: cinema search and collection still work.
    } finally {
      setChargementLetterboxd(false)
    }
  }, [])

  useEffect(() => {
    chargerActiviteLetterboxd()
  }, [chargerActiviteLetterboxd])

  const importerFichierLetterboxd = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setMessageImportLetterboxd('')
    const resultat = await importerLetterboxd(file)
    if (resultat) {
      await chargerActiviteLetterboxd()
      setMessageImportLetterboxd(
        `${resultat.imported ?? 0} films importés, ${resultat.reviews ?? 0} avis et ${resultat.comments ?? 0} commentaires ajoutés${
          resultat.skipped ? `, ${resultat.skipped} déjà présents` : ''
        }.`,
      )
    }
  }

  const formaterDateLetterboxd = (value) => {
    if (!value) return 'Date inconnue'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR')
  }

  const ajouterFilmDepuisFormulaire = async (film, formulaire) => {
    await ajouterFilm({
      ...film,
      category: 'cinema',
      ...formulaire,
    })
    setFilmEnEdition('')
  }

  return (
    <main className="work-page">
      <section className="work-card work-card--wide">
        <p className="work-card__eyebrow">Cinema</p>
        <h1>Mon cinema 2026</h1>
        <p className="work-card__text">
          Recherche un film, note-le avant de l&apos;ajouter et garde une collection plus visuelle de
          ta watchlist, de tes vues et de tes favoris.
        </p>

        <section className="cinema-hero">
          <div className="cinema-hero__copy">
            <p className="cinema-hero__eyebrow">Selection 2026</p>
            <h2>Un espace cinema plus visuel, avec affiches, etoiles et avis perso.</h2>
            <p>
              Tu peux chercher un film, le classer en watchlist, vue ou favori, lui donner une note
              et ajouter un commentaire avant validation.
            </p>
          </div>
          <div className="cinema-hero__stats">
            <article>
              <strong>{filmsSauvegardes.length}</strong>
              <span>films sauvegardes</span>
            </article>
            <article>
              <strong>{filmsAVenir.length}</strong>
              <span>sorties a venir</span>
            </article>
          </div>
        </section>

        <nav className="cinema-section-nav" aria-label="Menu cinéma">
          <a href="#cinema-upcoming">Sorties à venir</a>
          <a href="#cinema-explorer">Explorer TMDb</a>
          <a href="#cinema-collection">Ma collection</a>
          <a href="#cinema-letterboxd">Letterboxd</a>
        </nav>

        <section className="cinema-panel cinema-import-panel" id="cinema-letterboxd">
          <div className="cinema-panel__header">
            <div>
              <p className="cinema-hero__eyebrow">Dans mon cinéma</p>
              <h2>Letterboxd, mes avis et mes commentaires</h2>
              <p className="reference-panel__note">
                Importe ton ZIP Letterboxd ici. Les films, critiques et commentaires restent intégrés
                à ton espace cinéma et seront conservés dans PostgreSQL une fois la connexion activée.
              </p>
            </div>
            <label className="cinema-import__button">
              {importationLetterboxdEnCours ? 'Import en cours...' : 'Choisir le ZIP'}
              <input
                accept=".zip,application/zip"
                disabled={importationLetterboxdEnCours}
                onChange={importerFichierLetterboxd}
                type="file"
              />
            </label>
          </div>
          <div className="letterboxd-inline-stats">
            <span>{avisLetterboxd.length} avis</span>
            <span>{commentairesLetterboxd.length} commentaires</span>
          </div>
          {messageImportLetterboxd ? <p className="cinema-import__message">{messageImportLetterboxd}</p> : null}
          {chargementLetterboxd ? <p className="media-panel__empty">Chargement de Letterboxd...</p> : null}
          {!chargementLetterboxd && (avisLetterboxd.length || commentairesLetterboxd.length) ? (
            <div className="letterboxd-inline-content">
              <div>
                <h3>Mes derniers avis</h3>
                <div className="letterboxd-inline-list">
                  {avisLetterboxd.map((avis) => (
                    <article className="letterboxd-review-card" key={avis.id}>
                      <div className="letterboxd-review-card__top">
                        <div>
                          <p className="movie-card__meta">
                            {avis.year || 'Année inconnue'} · {formaterDateLetterboxd(avis.review_date || avis.created_at)}
                          </p>
                          <h3>{avis.title || 'Film Letterboxd'}</h3>
                        </div>
                        <span className="saved-movie-card__rating">
                          {avis.rating ? `${avis.rating}/5` : 'Non noté'}
                        </span>
                      </div>
                      <p className="letterboxd-review-card__text">{avis.review || 'Avis sans texte.'}</p>
                    </article>
                  ))}
                </div>
              </div>
              <div>
                <h3>Mes commentaires</h3>
                <div className="letterboxd-inline-list">
                  {commentairesLetterboxd.map((commentaire) => (
                    <article className="letterboxd-comment-card" key={commentaire.id}>
                      <p className="movie-card__meta">{formaterDateLetterboxd(commentaire.comment_date || commentaire.created_at)}</p>
                      <p>{commentaire.comment}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="cinema-panel" id="cinema-upcoming">
          <div className="cinema-panel__header">
            <div>
              <h2>Films a venir</h2>
              <p className="reference-panel__note">Recuperes via TMDb pour nourrir ton inspiration.</p>
            </div>
          </div>

          {chargementFilmsAVenir ? (
            <p className="media-panel__empty">Chargement des sorties a venir...</p>
          ) : filmsAVenir.length ? (
            <div className="upcoming-strip">
              {filmsAVenir.map((film) => (
                <article className="upcoming-card" key={film.tmdb_id}>
                  <div className="upcoming-card__poster">
                    {obtenirImageFilm(film) ? (
                      <img alt={film.title} src={obtenirImageFilm(film)} />
                    ) : (
                      <div className="movie-card__poster-fallback">Affiche indisponible</div>
                    )}
                  </div>
                  <div className="upcoming-card__body">
                    <p className="movie-card__meta">
                      {film.release_date
                        ? new Date(film.release_date).toLocaleDateString('fr-FR')
                        : 'Date inconnue'}
                    </p>
                    <h3>{film.title}</h3>
                    <FormulaireFilm
                      libelleBouton="Noter ce film"
                      key={`upcoming-form-${film.tmdb_id}`}
                      ouvert={filmEnEdition === `upcoming-${film.tmdb_id}`}
                      sauvegardeEnCours={sauvegardeEnCours}
                      ouvrir={() => setFilmEnEdition(`upcoming-${film.tmdb_id}`)}
                      valider={(formulaire) => ajouterFilmDepuisFormulaire(film, formulaire)}
                      libelleValidation="Ajouter a ma collection"
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="media-panel__empty">
              Aucune sortie a venir disponible. Verifie ton token TMDb.
            </p>
          )}
        </section>

        <section className="cinema-panel" id="cinema-explorer">
          <div className="cinema-panel__header">
            <div>
              <h2>Recherche TMDb</h2>
              <p className="reference-panel__note">Le back appelle TMDb. La cle reste cote serveur.</p>
            </div>
          </div>

          <form className="cinema-search" onSubmit={validerRecherche}>
            <input
              className="cinema-search__input"
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Ex: Interstellar, La La Land, Dune..."
              type="search"
              value={recherche}
            />
            <button className="cinema-search__button" type="submit">
              {rechercheEnCours ? 'Recherche...' : 'Rechercher'}
            </button>
          </form>

          {erreur ? <p className="media-panel__error">{erreur}</p> : null}

          {resultatsRecherche.length ? (
            <div className="movie-grid">
              {resultatsRecherche.map((film) => (
                <article className="movie-card movie-card--search" key={film.tmdb_id}>
                  <div className="movie-card__poster">
                    {obtenirImageFilm(film) ? (
                      <img alt={film.title} src={obtenirImageFilm(film)} />
                    ) : (
                      <div className="movie-card__poster-fallback">Affiche indisponible</div>
                    )}
                  </div>
                  <div className="movie-card__body">
                    <p className="movie-card__meta">
                      {film.release_date ? film.release_date.slice(0, 4) : 'Date inconnue'}
                    </p>
                    <h3>{film.title}</h3>
                    <p>{film.overview || 'Pas de synopsis disponible.'}</p>
                    <FormulaireFilm
                      libelleBouton="Noter ce film"
                      key={`search-form-${film.tmdb_id}`}
                      ouvert={filmEnEdition === `search-${film.tmdb_id}`}
                      sauvegardeEnCours={sauvegardeEnCours}
                      ouvrir={() => setFilmEnEdition(`search-${film.tmdb_id}`)}
                      valider={(formulaire) => ajouterFilmDepuisFormulaire(film, formulaire)}
                      libelleValidation="Ajouter a ma collection"
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section className="cinema-panel" id="cinema-collection">
          <div className="cinema-panel__header">
            <div>
              <h2>Mes films</h2>
              <p className="reference-panel__note">Ta selection sauvegardee localement dans le projet.</p>
            </div>
            <div className="filter-chips" role="tablist" aria-label="Filtres cinema">
              {OPTIONS_FILTRE_FILM.map((option) => (
                <button
                  aria-pressed={filtreActif === option.value}
                  className={`filter-chip ${filtreActif === option.value ? 'filter-chip--active' : ''}`}
                  key={option.value}
                  onClick={() => setFiltreActif(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {chargementFilmsSauvegardes ? (
            <p className="media-panel__empty">Chargement de tes films...</p>
          ) : filmsSauvegardesFiltres.length ? (
            <div className="saved-movie-list">
              {filmsSauvegardesFiltres.map((film) => (
                <article className="saved-movie-card" key={film.id}>
                  <div className="saved-movie-card__poster">
                    {obtenirImageFilm(film) ? (
                      <img alt={film.title} src={obtenirImageFilm(film)} />
                    ) : (
                      <div className="movie-card__poster-fallback">Affiche indisponible</div>
                    )}
                  </div>
                  <div className="saved-movie-card__content">
                    <div className="saved-movie-card__top">
                      <div>
                        <p className="movie-card__meta">
                          {film.release_date ? film.release_date.slice(0, 4) : 'Date inconnue'}
                        </p>
                        <h3>{film.title}</h3>
                      </div>
                      <button
                        className="media-card__delete"
                        onClick={() => supprimerFilm(film.id)}
                        type="button"
                      >
                        Supprimer
                      </button>
                    </div>

                    <div className="saved-movie-card__summary">
                      <span className="saved-movie-card__badge">{obtenirLibelleStatutFilm(film.personal_status)}</span>
                      {film.personal_rating ? (
                        <span className="saved-movie-card__rating">{`${film.personal_rating}/5`}</span>
                      ) : (
                        <span className="saved-movie-card__rating saved-movie-card__rating--muted">
                          Pas encore note
                        </span>
                      )}
                    </div>

                    {film.personal_note ? (
                      <p className="saved-movie-card__note">{film.personal_note}</p>
                    ) : null}

                    <FormulaireFilm
                      libelleBouton="Modifier"
                      noteInitiale={film.personal_note ?? ''}
                      noteEtoilesInitiale={film.personal_rating ?? 0}
                      statutInitial={film.personal_status ?? 'watchlist'}
                      key={`saved-form-${film.id}-${film.personal_status ?? 'watched'}-${film.personal_rating ?? 0}-${film.personal_note ?? ''}`}
                      ouvert={filmEnEdition === `saved-${film.id}`}
                      sauvegardeEnCours={false}
                      ouvrir={() => setFilmEnEdition(`saved-${film.id}`)}
                      valider={async (formulaire) => {
                        await enregistrerFilm(film.id, formulaire)
                        setFilmEnEdition('')
                      }}
                      libelleValidation="Enregistrer"
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="media-panel__empty">
              Aucun film ne correspond au filtre `{filtreActif}` pour le moment.
            </p>
          )}
        </section>

        <a className="work-card__back" href="#/">
          Retour au vision board
        </a>
      </section>
    </main>
  )
}
