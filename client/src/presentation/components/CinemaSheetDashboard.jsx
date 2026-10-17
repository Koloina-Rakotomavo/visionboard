import { useMemo, useState } from 'react'
import snapshot from '../../data/cinema-sheet.json'
import { cleanCategory, normalizeRecord, summarize, watchedYear } from './cinemaStats'
import '../styles/CinemaSheetDashboard.css'
import { CinemaCharts } from './CinemaCharts'

const records = snapshot.records.map(normalizeRecord)

export function CinemaSheetDashboard() {
  const [year, setYear] = useState('all')
  const [query, setQuery] = useState('')
  const years = [...new Set(records.map(record => watchedYear(record.watched_date)).filter(Boolean))].sort().reverse()
  const selected = useMemo(() => records.filter(record => year === 'all' || (year === 'unknown' ? !watchedYear(record.watched_date) : watchedYear(record.watched_date) === year)), [year])
  const stats = useMemo(() => summarize(selected), [selected])
  const visible = useMemo(() => selected.filter(record => record.title.toLocaleLowerCase('fr-FR').includes(query.trim().toLocaleLowerCase('fr-FR'))), [selected, query])
  const cinemaRecords = selected.filter(record => record.viewing_mode === 'Cinéma')
  return (
    <section className="cinema-panel sheet-dashboard" id="cinema-statistics" aria-labelledby="sheet-heading">
      <div className="cinema-panel__header">
        <div><h2 id="sheet-heading">Mon cinéma en chiffres</h2><p className="reference-panel__note">Mes visionnages, depuis mon tableau Google Sheets.</p></div>
        <label className="sheet-year">Année de visionnage
          <select value={year} onChange={event => setYear(event.target.value)}>
            <option value="all">Toutes les années</option>
            {years.map(value => <option key={value}>{value}</option>)}
            <option value="unknown">Année non précisée</option>
          </select>
        </label>
      </div>
      <div className="sheet-kpis" aria-live="polite">
        <article><strong>{stats.sessions}</strong><span>visionnages enregistrés</span></article>
        <article><strong>{stats.films}</strong><span>films distincts (titre et année)</span></article>
        <article><strong>{stats.knownDurations ? `${Math.floor(stats.minutes / 60)} h ${stats.minutes % 60} min` : '—'}</strong><span>durée connue · {stats.knownDurations}/{stats.sessions} lignes</span></article>
        <article><strong>{cinemaRecords.length}</strong><span>visionnages au cinéma</span></article>
      </div>
      <p className="sheet-caption">Une ligne du tableau = un visionnage enregistré, pas nécessairement un film unique. {stats.unknownYears} ligne(s) sans année de visionnage exploitable. Aucun mois ni jour n’est inventé.</p>
      <p className="sheet-selection" role="status">{year === 'all' ? 'Toutes les années' : year === 'unknown' ? 'Année non précisée' : year} · {selected.length} visionnages {year !== 'all' && <button type="button" onClick={() => setYear('all')}>Réinitialiser le filtre</button>}</p>
      <CinemaCharts records={records} selected={selected} year={year} onYearChange={setYear} />
      <details className="sheet-library">
        <summary>Parcourir les {selected.length} visionnages du tableau</summary>
        <label className="sheet-year">Rechercher dans les titres<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Titre du film" /></label>
        <p role="status">{visible.length} résultat(s). La recherche ne change pas les statistiques.</p>
        <div className="sheet-table-scroll" role="region" aria-label="Tableau des visionnages" tabIndex={0}>
          <table><thead><tr><th scope="col">Film</th><th scope="col">Sortie</th><th scope="col">Visionnage</th><th scope="col">Support</th><th scope="col">Durée</th></tr></thead>
            <tbody>{visible.map(record => <tr key={record.id}><th scope="row">{record.title}</th><td>{record.release_year ?? '—'}</td><td>{record.watched_date ?? 'Non renseigné'}</td><td>{cleanCategory(record.viewing_mode)}</td><td>{record.duration_minutes ? `${record.duration_minutes} min` : '—'}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
      <p className="sheet-caption">Copie publiée sur GitHub, actualisée par la tâche de synchronisation. Les données restent consultables même si le serveur TMDb est indisponible.</p>
    </section>
  )
}
