import { useEffect, useState } from 'react'
import {
  createMovie as creerFilm,
  deleteMovie as supprimerFilmApi,
  listExploreMovies as listerFilmsExploration,
  listSavedMovies as listerFilmsSauvegardes,
  searchMovies as chercherFilms,
  updateMovie as mettreAJourFilm,
} from '../../infrastructure/api/moviesApi'

const MODE_EXPLORATION_INITIAL = 'trending_week'

export function useFilmsCinema() {
  const [filmsSauvegardes, setFilmsSauvegardes] = useState([])
  const [filmsTmdb, setFilmsTmdb] = useState([])
  const [resultatsRecherche, setResultatsRecherche] = useState([])
  const [chargementFilmsSauvegardes, setChargementFilmsSauvegardes] = useState(true)
  const [chargementFilmsTmdb, setChargementFilmsTmdb] = useState(true)
  const [chargementSuiteFilmsTmdb, setChargementSuiteFilmsTmdb] = useState(false)
  const [modeFilmsTmdb, setModeFilmsTmdb] = useState(MODE_EXPLORATION_INITIAL)
  const [pageFilmsTmdb, setPageFilmsTmdb] = useState(1)
  const [totalPagesFilmsTmdb, setTotalPagesFilmsTmdb] = useState(1)
  const [totalFilmsTmdb, setTotalFilmsTmdb] = useState(0)
  const [rechercheEnCours, setRechercheEnCours] = useState(false)
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let requeteAnnulee = false

    const chargerFilmsInitiaux = async () => {
      try {
        const [filmsDejaSauvegardes, exploration] = await Promise.all([
          listerFilmsSauvegardes(),
          listerFilmsExploration({ mode: MODE_EXPLORATION_INITIAL }).catch(() => null),
        ])

        if (!requeteAnnulee) {
          setFilmsSauvegardes(filmsDejaSauvegardes)
          if (exploration) {
            setFilmsTmdb(exploration.items ?? [])
            setPageFilmsTmdb(exploration.page ?? 1)
            setTotalPagesFilmsTmdb(exploration.total_pages ?? 1)
            setTotalFilmsTmdb(exploration.total_results ?? 0)
          }
        }
      } catch (erreurRequete) {
        if (!requeteAnnulee) {
          setErreur(erreurRequete.message)
        }
      } finally {
        if (!requeteAnnulee) {
          setChargementFilmsSauvegardes(false)
          setChargementFilmsTmdb(false)
        }
      }
    }

    chargerFilmsInitiaux()

    return () => {
      requeteAnnulee = true
    }
  }, [])

  const rafraichirFilmsSauvegardes = async () => {
    setChargementFilmsSauvegardes(true)
    setErreur('')

    try {
      const films = await listerFilmsSauvegardes()
      setFilmsSauvegardes(films)
    } catch (erreurRequete) {
      setErreur(erreurRequete.message)
    } finally {
      setChargementFilmsSauvegardes(false)
    }
  }

  const rechercherFilms = async (recherche) => {
    if (!recherche.trim()) {
      setResultatsRecherche([])
      return
    }

    setRechercheEnCours(true)
    setErreur('')

    try {
      const films = await chercherFilms(recherche.trim())
      setResultatsRecherche(films)
    } catch (erreurRequete) {
      setErreur(erreurRequete.message)
    } finally {
      setRechercheEnCours(false)
    }
  }

  const chargerFilmsTmdb = async (mode) => {
    setModeFilmsTmdb(mode)
    setChargementFilmsTmdb(true)
    setErreur('')

    try {
      const exploration = await listerFilmsExploration({ mode, page: 1 })
      setFilmsTmdb(exploration.items ?? [])
      setPageFilmsTmdb(exploration.page ?? 1)
      setTotalPagesFilmsTmdb(exploration.total_pages ?? 1)
      setTotalFilmsTmdb(exploration.total_results ?? 0)
    } catch (erreurRequete) {
      setErreur(erreurRequete.message)
    } finally {
      setChargementFilmsTmdb(false)
    }
  }

  const chargerPlusFilmsTmdb = async () => {
    if (chargementSuiteFilmsTmdb || pageFilmsTmdb >= totalPagesFilmsTmdb) {
      return
    }

    setChargementSuiteFilmsTmdb(true)
    setErreur('')

    try {
      const exploration = await listerFilmsExploration({
        mode: modeFilmsTmdb,
        page: pageFilmsTmdb + 1,
      })
      setFilmsTmdb((filmsActuels) => {
        const idsActuels = new Set(filmsActuels.map((film) => film.tmdb_id))
        const nouveauxFilms = (exploration.items ?? []).filter((film) => !idsActuels.has(film.tmdb_id))
        return [...filmsActuels, ...nouveauxFilms]
      })
      setPageFilmsTmdb(exploration.page ?? pageFilmsTmdb + 1)
      setTotalPagesFilmsTmdb(exploration.total_pages ?? totalPagesFilmsTmdb)
      setTotalFilmsTmdb(exploration.total_results ?? totalFilmsTmdb)
    } catch (erreurRequete) {
      setErreur(erreurRequete.message)
    } finally {
      setChargementSuiteFilmsTmdb(false)
    }
  }

  const ajouterFilm = async (film) => {
    setSauvegardeEnCours(true)
    setErreur('')

    try {
      await creerFilm(film)
      await rafraichirFilmsSauvegardes()
    } catch (erreurRequete) {
      setErreur(erreurRequete.message)
    } finally {
      setSauvegardeEnCours(false)
    }
  }

  const enregistrerFilm = async (id, modifications) => {
    setErreur('')

    try {
      const filmMisAJour = await mettreAJourFilm(id, modifications)
      setFilmsSauvegardes((filmsActuels) =>
        filmsActuels.map((film) => (film.id === id ? filmMisAJour : film)),
      )
    } catch (erreurRequete) {
      setErreur(erreurRequete.message)
    }
  }

  const supprimerFilm = async (id) => {
    setErreur('')

    try {
      await supprimerFilmApi(id)
      setFilmsSauvegardes((filmsActuels) => filmsActuels.filter((film) => film.id !== id))
    } catch (erreurRequete) {
      setErreur(erreurRequete.message)
    }
  }

  return {
    ajouterFilm,
    chargerFilmsTmdb,
    chargerPlusFilmsTmdb,
    chargementFilmsSauvegardes,
    chargementFilmsTmdb,
    chargementSuiteFilmsTmdb,
    enregistrerFilm,
    erreur,
    filmsSauvegardes,
    filmsTmdb,
    modeFilmsTmdb,
    pageFilmsTmdb,
    rafraichirFilmsSauvegardes,
    rechercheEnCours,
    rechercherFilms,
    resultatsRecherche,
    sauvegardeEnCours,
    supprimerFilm,
    totalFilmsTmdb,
    totalPagesFilmsTmdb,
  }
}
