import { useState } from 'react'
import { formatDays, formatHours, percentOf } from './cinemaAnalytics'

const displayTime = data => data.known ? `${data.estimated ? '≈ ' : ''}${formatHours(data.minutes)}` : '—'
const plural = (count, singular, pluralForm = `${singular}s`) => count > 1 ? pluralForm : singular

export function PersonPortrait({ person }) {
  const [failed, setFailed] = useState(false)
  return person?.profile_url && !failed ? <img src={person.profile_url} alt={person.name} loading="lazy" onError={() => setFailed(true)} /> : <span className="cinema-actor-initial" aria-hidden="true">{person?.name?.slice(0, 1) ?? '?'}</span>
}

export function CinemaInsightSummary({ selected, history, edition, year }) {
  const time = selected.cinemaTime
  const share = percentOf(selected.cinema, history.cinema)
  return <section className="cinema-insight-summary" aria-labelledby="cinema-insight-heading">
    <div className="cinema-insight-lead"><div><p className="cinema-insight-label">{edition} · ce que racontent tes films</p><h2 id="cinema-insight-heading">{time.known ? <>{displayTime(time)}<br /><span>au cinéma.</span></> : <>{selected.sessions} histoires<br /><span>à ton actif.</span></>}</h2></div><p>{time.known ? <>L’équivalent de <strong>{formatDays(time.minutes)} {plural(time.minutes / 1440, 'journée')}</strong> de 24 h, pour <strong>{selected.cinema} {plural(selected.cinema, 'séance')}</strong> en salle.</> : <>Les séances sans support ou sans durée restent dans ton historique.</>}{year !== 'all' && share !== null && <> Cette sélection représente {share} % de tes {history.cinema} séances en salle enregistrées au total.</>}</p></div>
    <div className="cinema-metric-rail">
      <div><strong>{selected.films}</strong><span>films distincts dans cette édition</span><small>{selected.sessions} visionnages, reprises comprises</small></div>
      <div><strong>{displayTime(selected.totalTime)}</strong><span>de films, tous supports confondus</span><small>{formatDays(selected.totalTime.minutes)} journées · {selected.totalTime.known} / {selected.sessions} durées</small></div>
      <div><strong>{displayTime(history.cinemaTime)}</strong><span>temps calculable en salle, à vie</span><small>{formatDays(history.cinemaTime.minutes)} journées de 24 h · {history.cinemaTime.known} / {history.cinema} séances</small></div>
      <div><strong>{history.films}</strong><span>films distincts à vie</span><small>sur tes {history.sessions} visionnages enregistrés</small></div>
    </div>
    <p className="cinema-life-takeaway">Sur tout ton historique, les durées calculables cumulent <strong>{displayTime(history.totalTime)} de films</strong>, soit <strong>{formatDays(history.totalTime.minutes)} journées de 24 h</strong>, tous supports confondus. <span>{history.totalTime.known} / {history.sessions} visionnages ont une durée renseignée ou estimée.</span></p>
    <details className="cinema-calculation-note"><summary>Comment ces durées sont calculées</summary><p>En salle, cette édition comprend {formatHours(time.confirmedMinutes)} renseignées dans ton tableau{time.estimated ? ` et ${formatHours(time.estimatedMinutes)} estimées à partir des durées TMDb` : ''}. {time.known} / {time.total} séances ont une durée exploitable.</p><p>Sur tout ton historique : {formatHours(history.cinemaTime.confirmedMinutes)} renseignées en salle{history.cinemaTime.estimated ? ` + ${formatHours(history.cinemaTime.estimatedMinutes)} estimées via TMDb` : ''} ; {history.cinemaTime.missing} séances sans durée. Seules les lignes marquées « Cinéma » sont comptées en salle ; {history.unknownSupports} supports inconnus ne sont pas attribués au cinéma. « À vie » désigne les films présents dans ton tableau, y compris ceux sans année. Une journée équivaut à 24 h. Les génériques sont compris dans la durée du film ; trajets et publicités ne sont pas comptés.</p></details>
  </section>
}

function ActorWinner({ data, loading = false }) {
  const first = data.ranking[0]
  if (!first) return <span className="cinema-muted">{loading ? 'Chargement des castings…' : 'Casting non renseigné'}</span>
  return <div className="cinema-actor-winner"><PersonPortrait key={first.id} person={first} /><div><strong>{first.name}</strong><span>{first.count} {plural(first.count, 'visionnage')} · {first.filmCount} {plural(first.filmCount, 'film')} distinct{first.filmCount > 1 ? 's' : ''}</span>{data.leaders.length > 1 && <small>Ex æquo avec {data.leaders.slice(1, 3).map(person => person.name).join(', ')}{data.leaders.length > 3 ? ` et ${data.leaders.length - 3} autres` : ''}</small>}{data.leaders.length > 3 && <details className="cinema-actor-ties"><summary>Voir les {data.leaders.length} ex æquo</summary><p>{data.leaders.map(person => person.name).join(', ')}</p></details>}</div></div>
}

export function CinemaActorHistory({ annual, history, loading, mode = 'all', onModeChange = () => {} }) {
  const [all, setAll] = useState(false)
  return <section className="cinema-actor-history" aria-labelledby="actor-history-title"><header className="cinema-view-heading"><h2 id="actor-history-title">Les visages qui reviennent.</h2><p>Ton casting le plus regardé, par année et sur tout ton historique.</p></header>
    <label className="cinema-cast-filter">Personnes comptées<select value={mode} onChange={event => onModeChange(event.target.value)}><option value="all">Casting complet, voix comprises</option><option value="leading">10 premiers noms au casting</option></select></label>
    {mode === 'all' && history.leadingActors.ranking[0] && history.leadingActors.ranking[0].id !== history.actors.ranking[0]?.id && <p className="cinema-comparison-takeaway">Le périmètre change le résultat : en gardant seulement les dix premiers noms au casting, <strong>{history.leadingActors.ranking[0].name}</strong> arrive en tête avec <strong>{history.leadingActors.ranking[0].count} visionnages</strong>{history.leadingActors.leaders.length > 1 ? ', ex æquo avec ' + history.leadingActors.leaders.slice(1, 3).map(person => person.name).join(', ') : ''}.</p>}
    <div className="cinema-lifetime-actor"><div><span className="cinema-insight-label">À vie · ton historique renseigné</span><ActorWinner data={history.actors} loading={loading} /></div><div className="cinema-actor-runners">{history.actors.ranking.slice(1, 4).map(person => <div key={person.id}><span>{person.name}</span><strong>{person.count} visionnages{person.count !== person.filmCount ? ` · ${person.filmCount} distincts` : ''}</strong></div>)}</div></div>
    <div className="cinema-actor-years">{annual.map(item => <article key={item.year}><div className="cinema-actor-year-label"><h3>{item.year}</h3><small>{item.actors.covered} / {item.sessions} castings connus</small></div><ActorWinner data={item.actors} loading={loading} /></article>)}</div>
    <p className="cinema-insights-note">Un même acteur compte une fois par visionnage, même s’il joue plusieurs rôles. {mode === 'all' ? 'Voix et apparitions listées au casting TMDb incluses.' : 'Seuls les dix premiers noms, dans l’ordre du casting TMDb, sont comptés ; ce filtre ne mesure pas le temps à l’écran.'} Les films sans année entrent dans le classement à vie. Les ex æquo sont indiqués ; aucun temps de présence à l’écran n’est supposé.</p>
    <button type="button" className="cinema-text-button" aria-expanded={all} onClick={() => setAll(!all)}>{all ? 'Masquer le top 10' : 'Voir le top 10 à vie'}</button>
    {all && <ol className="cinema-top-actors">{history.actors.ranking.slice(0, 10).map(person => <li key={person.id}><ActorWinner data={{ ranking: [person], leaders: [person] }} /></li>)}</ol>}
    <p className="cinema-insights-note">Classement basé sur {history.actors.covered} / {history.sessions} visionnages avec casting disponible.</p>
  </section>
}

export function CinemaYearComparison({ annual, history }) {
  const [firstYear, setFirstYear] = useState(annual[0]?.year ?? '')
  const [secondYear, setSecondYear] = useState(annual[1]?.year ?? annual[0]?.year ?? '')
  const first = annual.find(item => item.year === firstYear), second = annual.find(item => item.year === secondYear)
  const max = Math.max(1, ...annual.map(item => item.sessions))
  if (!first || !second) return null
  const metrics = [
    ['Visionnages enregistrés', first.sessions, second.sessions],
    ['Films distincts', first.films, second.films],
    ['Séances au cinéma', first.cinema, second.cinema],
    ['Temps en salle', displayTime(first.cinemaTime), displayTime(second.cinemaTime)],
    ['Temps de films, tous supports', displayTime(first.totalTime), displayTime(second.totalTime)],
  ]
  const difference = first.sessions - second.sessions
  return <section className="cinema-year-comparison" aria-labelledby="comparison-title"><header className="cinema-view-heading"><h2 id="comparison-title">D’une année à l’autre.</h2><p>Compare le nombre de films et le temps que tu leur as consacré.</p></header>
    <div className="cinema-year-bars" aria-label="Visionnages par année">{annual.slice().reverse().map(item => <div key={item.year}><span>{item.year}</span><div className="cinema-year-track" aria-hidden="true"><span style={{ width: `${item.sessions / max * 100}%` }} /></div><strong>{item.sessions}</strong><span className="sr-only">visionnages</span></div>)}</div>
    <div className="cinema-compare-tools"><label>Première année<select value={firstYear} onChange={event => setFirstYear(event.target.value)}>{annual.map(item => <option key={item.year}>{item.year}</option>)}</select></label><span aria-hidden="true">/</span><label>Deuxième année<select value={secondYear} onChange={event => setSecondYear(event.target.value)}>{annual.map(item => <option key={item.year}>{item.year}</option>)}</select></label></div>
    <div className="cinema-comparison-scroll"><table><caption className="sr-only">Comparaison de {firstYear} et {secondYear}</caption><thead><tr><th scope="col">Indicateur</th><th scope="col">{firstYear}</th><th scope="col">{secondYear}</th></tr></thead><tbody>{metrics.map(([label, a, b]) => <tr key={label}><th scope="row">{label}</th><td>{a}</td><td>{b}</td></tr>)}</tbody></table></div>
    <p className="cinema-comparison-takeaway">{firstYear === secondYear ? 'Choisis deux années différentes pour les comparer.' : difference === 0 ? `Tu as enregistré autant de visionnages en ${firstYear} qu’en ${secondYear}.` : <>Tu as enregistré <strong>{Math.abs(difference)} visionnages {difference > 0 ? 'de plus' : difference < 0 ? 'de moins' : 'd’écart'}</strong> en {firstYear} qu’en {secondYear}.</>}</p>
    <p className="cinema-insights-note">Comparaison des lignes renseignées : l’année 2026 est en cours et les années peuvent être incomplètes. {history.unknownYears} visionnages sans année restent inclus dans le total à vie, mais sont exclus de ce graphique. « ≈ » signale une durée complétée par TMDb.</p>
  </section>
}
