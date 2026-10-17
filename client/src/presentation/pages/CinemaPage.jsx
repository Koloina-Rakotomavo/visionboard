import { useMemo, useState } from 'react'
import snapshot from '../../data/cinema-sheet.json'
import { CinemaRecap } from '../components/CinemaRecap'
import { CinemaLibrary } from '../components/CinemaLibrary'
import { CinemaExplore } from '../components/CinemaExplore'
import { filterYear, normalizeFilms, recapSummary } from '../components/cinemaRecap'
import { watchedYear } from '../components/cinemaStats'
import { useCinemaCatalog } from '../hooks/useCinemaCatalog'
import '../styles/CinemaWrapped.css'

const records = normalizeFilms(snapshot.records)
const years = [...new Set(records.map(record => watchedYear(record.watched_date)).filter(Boolean))].sort().reverse()
const VIEWS = [{ id: 'recap', label: 'Mon récap' }, { id: 'films', label: 'Mes films' }, { id: 'explore', label: 'Explorer' }]

export function CinemaPage() {
  const [year, setYear] = useState(years.includes('2026') ? '2026' : years[0] ?? 'all')
  const [view, setView] = useState('recap')
  const selected = useMemo(() => filterYear(records, year), [year])
  const { catalog, failed } = useCinemaCatalog(selected)
  const stats = useMemo(() => recapSummary(selected, catalog), [selected, catalog])
  const edition = year === 'all' ? 'Toutes les années' : year === 'unknown' ? 'Sans année précisée' : year
  return <main className="cinema-app" id="cinema-statistics">
    <header className="cinema-masthead"><div><p>Le cinéma de Koloina</p><h1>Au premier rang.</h1></div><label className="cinema-edition"><span>Édition</span><select value={year} onChange={event => setYear(event.target.value)}><option value="all">Toutes les années</option>{years.map(value => <option key={value}>{value}</option>)}<option value="unknown">Sans année précisée</option></select></label></header>
    <div className="cinema-switcher" role="group" aria-label="Vues cinéma">{VIEWS.map(item => <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => setView(item.id)}>{item.label}</button>)}</div>
    {view === 'recap' ? <CinemaRecap key={year} stats={stats} edition={edition} onCollection={() => setView('films')} /> : view === 'films' ? <CinemaLibrary key={year} stats={stats} /> : <CinemaExplore />}
    <footer className="cinema-credits"><div><span>Ton tableau, tes histoires.</span><p>{stats.matched} / {stats.sessions} films reliés à TMDb pour cette édition.{year === '2026' ? ' Récap 2026 en cours.' : ''}{failed ? ' Certaines fiches sont momentanément indisponibles.' : ''}</p></div><details><summary>Sources et crédits</summary><a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="cinema-tmdb-credit"><img width="82" height="11" alt="TMDB" src="https://www.themoviedb.org/assets/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" /></a><p>Visionnages et durées : ton tableau Google Sheets. Affiches, genres et réalisateurs : <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">TMDb</a>. Les films non reconnus restent dans ta collection. Les genres sont comptés par visionnage ; un film peut avoir plusieurs genres.</p><p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p></details></footer>
  </main>
}
